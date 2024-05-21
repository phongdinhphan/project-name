import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from 'src/common/custom-exceptions';
import { ErrorCustom } from 'src/common/error-custom';
import { Group } from 'src/entities/group.entity';
import { GroupsVouchers } from 'src/entities/groups_vouchers.entity';
import { Voucher } from 'src/entities/voucher.entity';
import { Between, DataSource, In, LessThan, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import * as nodemailer from 'nodemailer';
import { CustomResponse } from 'src/common/response_success';
import { UsersUsedVoucher } from 'src/entities/users_used_voucher.entity';
import { Cron } from '@nestjs/schedule';
import * as cron from 'node-cron';
class EmailNeedToSend {
  v_expired_date: Date
  gv_voucher_id: number
  u_user_id: number
  u_name: string
  u_email: string
}


@Injectable()
export class VouchersService {

  constructor(
    @InjectRepository(Voucher) private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(Group) private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupsVouchers) private readonly groupsVouchersRepository: Repository<GroupsVouchers>,
    @InjectRepository(UsersUsedVoucher) private readonly usersUsedVoucherRepository: Repository<UsersUsedVoucher>,
    private dataSource: DataSource,
  ) { }



  async createVoucher(createVoucherDto: CreateVoucherDto, pathImage: string, idUserCreate) {
    const { assign_groups } = createVoucherDto

    if (!pathImage) {
      throw new ErrorCustom(ERROR_RESPONSE.ImageIsRequired)
    }
    const newVoucher = this.voucherRepository.create({
      image: pathImage,
      name: createVoucherDto.name,
      expired_date: createVoucherDto.expired_date,
      detail: createVoucherDto.detail,
      created_at: new Date(),
      created_by: idUserCreate
    })
    const findGroup = await this.findGroupAddToVoucher(assign_groups)
    const queryRunner = this.dataSource.createQueryRunner();
    await this.checkGroupExits(findGroup, assign_groups)

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdVoucher = await this.voucherRepository.save(newVoucher);
      for (const groups of findGroup) {
        const saveGroupsVouchers = await this.groupsVouchersRepository.create({
          group_id: groups.group_id,
          voucher_id: createdVoucher
        })
        await queryRunner.manager.save(Group, saveGroupsVouchers);
      }
      await queryRunner.commitTransaction();
      return createdVoucher;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ErrorCustom(ERROR_RESPONSE.InsertDataFailed)
    } finally {
      await queryRunner.release();
    }
  }

  async findGroupAddToVoucher(assign_groups: any) {
    try {
      const findGroup = await this.groupRepository.find({
        where: {
          group_id: In(assign_groups),
        },
      });

      return findGroup
    } catch (error) {

    }
  }

  checkGroupExits(findGroup: any, assign_groups: any) {
    const arrayUser = findGroup.map(group => group.group_id)
    const checkExits = assign_groups.filter(id => !arrayUser.includes(id))
    if (checkExits.length > 0) {
      throw new ErrorCustom(ERROR_RESPONSE.GroupNotExits, checkExits.join(', '))
    }
  }


  async checkVoucherUserSendMailExpired() {

    const currentDate = new Date();
    const nextDay = new Date();
    nextDay.setDate(currentDate.getDate() + 1);

    // get all expired_date and voucher_id
    const VoucherIdAboutToExpired = (await this.voucherRepository.find({
      where: {
        expired_date: Between(currentDate, nextDay)
      },
      select: ['expired_date', 'voucher_id'],
    })).map(data => data.voucher_id);

    if (VoucherIdAboutToExpired.length === 0) {
      return []; // Return empty array if no vouchers are about to expire
    }

    const queryBuilder = this.voucherRepository
      .createQueryBuilder('v')
      .leftJoin('v.groups_vouchers', 'gv')
      .leftJoin('gv.group', 'g')
      .leftJoin('g.user', 'u')
      .where('gv.voucher_id IN (:voucherId)', { voucherId: VoucherIdAboutToExpired })
      .select(['gv.voucher_id', 'v.expired_date', 'g.group_id', 'u.user_id', 'u.email', 'u.name']);

    const voucherInfoAndUsers = await queryBuilder.getRawMany();
    // //voucher used
    const getAllVoucherUsed = (await this.usersUsedVoucherRepository.find({
      where: {
        voucher_id: In(VoucherIdAboutToExpired),
      }
    })).map(data => ({ user_id: data.user_id, voucher_id: data.voucher_id }))


    const userNeededToSendEmail = voucherInfoAndUsers.filter(data =>
      !getAllVoucherUsed.map(dataUsed => dataUsed.user_id + '@' + dataUsed.voucher_id).includes(data.u_user_id + '@' + data.gv_voucher_id)
    );

    return userNeededToSendEmail
  }


  scheduleCronJob(cronExpression: string) {

  }


  async sendMailToUser(emailNeededSendmail: EmailNeedToSend[]) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.AUTH_EmailSend,
        pass: process.env.AUTH_Pass,
      },
    });  


    const emailPromises = emailNeededSendmail.map(async (voucher) => {
      const mailOptions = {
        from: process.env.AUTH_EmailSend,
        to: voucher.u_email,
        subject: 'Your Voucher is Expiring Soon',
        text: `Hello,\n\nYour voucher "${voucher.u_name}" is expiring on ${voucher.v_expired_date.toDateString()}. Don't miss out!\n\nBest regards,\nThe Voucher Team`,
      };
      await transporter.sendMail(mailOptions);  
    });
    try {
      await Promise.all(emailPromises);
      return new CustomResponse(SUCCESS_RESPONSE.ResponseSuccess)
    } catch (error) {
      return new ErrorCustom(ERROR_RESPONSE.InternalServer)
    }
  }
}
