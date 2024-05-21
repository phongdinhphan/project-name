import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from '../../common/custom-exceptions';
import { ErrorCustom } from '../../common/error-custom';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PASSWORD } from 'src/common/enum/password.enum.';
import { ROLE } from 'src/common/enum/role.enum';
import { Group } from 'src/entities/group.entity';
import { Voucher } from 'src/entities/voucher.entity';
import { UsersUsedVoucher } from 'src/entities/users_used_voucher.entity';
import { CustomResponse } from 'src/common/response_success';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Voucher) private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(UsersUsedVoucher) private readonly UserUsedVoucherRepository: Repository<UsersUsedVoucher>,


    private readonly roleService: RolesService,
    private readonly permissionService: PermissionsService,
    private dataSource: DataSource
  ) { }

  async createUser(createUserDto: CreateUserDto, idUserCreate: number, roleUserCreate: number) {
    const { email } = createUserDto
    const checkEmailInValid = await this.findOne(email)

    if (checkEmailInValid) {
      throw new ErrorCustom(ERROR_RESPONSE.InvalidEmail)
    }

    const queryRunner = this.dataSource.createQueryRunner();

    const checkPassword = await this.checkPassord(createUserDto.password)

    await queryRunner.connect();
    await queryRunner.startTransaction();
    if (roleUserCreate !== ROLE.ADMIN) {
      if (createUserDto.role_id !== ROLE.MEMBER) {
        throw new ErrorCustom(ERROR_RESPONSE.Unauthorized)
      }
    }
    try {
      const role = await this.roleService.findOne(createUserDto.role_id)
      const dataCreateUsers = await this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password: checkPassword,
        gender: createUserDto.gender,
        birthday: createUserDto.birthday,
        created_at: new Date(),
        created_by: idUserCreate,
        role_id: role
      })
      await queryRunner.manager.save(User, dataCreateUsers);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ErrorCustom(ERROR_RESPONSE.InsertDataFailed)
    } finally {
      await queryRunner.release();
    }
  }


  findAll(role_id: any) {
    return this.permissionService.getPermissionsForRoleId(role_id)
  }

  async findOne(email: string): Promise<User> {
    try {

      const infoUser = await this.userRepository.findOne({ where: { email } })
      return infoUser
    } catch (error) {
    }
  }

  async checkPassord(password: string) {
    if (password) {
      return await bcrypt.hash(password, 10)
    }
    return await bcrypt.hash(PASSWORD.PASSWORD_DEFAULT, 10)
  }

  async userUseVouchers(userId: number, voucherId: number) {
    const findVouchers = await this.voucherRepository.findOneBy({ voucher_id: voucherId })
    if (!findVouchers) {
      throw new ErrorCustom(ERROR_RESPONSE.VoucherNotFound)
    }

    await this.getVouchersUserCanUse(userId, voucherId)
    await this.checkUsedVouchers(userId, voucherId)
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let createUserUsedVouchers = await this.UserUsedVoucherRepository.create({
        user_id: userId,
        voucher_id: voucherId,
      })
      await queryRunner.manager.save(UsersUsedVoucher, createUserUsedVouchers);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ErrorCustom(ERROR_RESPONSE.InsertDataFailed)
    } finally {
      await queryRunner.release();
    }
  }

  async getVouchersUserCanUse(userId: number, voucherId: number) {
    const userHaveVouchers = await this.userRepository.find({
      where: {
        user_id: userId
      },
      relations: [
        'group_id',
        'group_id.groups_vouchers.voucher',

      ],
    });
    const findVoucherOfUser = userHaveVouchers.some(data => data.group_id.groups_vouchers.some(dataVoucher => dataVoucher.voucher_id === voucherId))
    if (!userHaveVouchers && !findVoucherOfUser) {
      throw new ErrorCustom(ERROR_RESPONSE.UserNotHaveVoucher)
    }
    return new CustomResponse(SUCCESS_RESPONSE.ResponseSuccess)
  }

  async checkUsedVouchers(userId: number, voucherId: number) {
    const findAllVouchersUsed = await this.UserUsedVoucherRepository.find(
      {
        where: {
          user_id: userId,
          voucher_id: voucherId
        }
      }
    )
    if (findAllVouchersUsed.length > 0) {
      throw new ErrorCustom(ERROR_RESPONSE.VoucherUsed)
    }
    return new CustomResponse(SUCCESS_RESPONSE.ResponseSuccess)
  }
}
