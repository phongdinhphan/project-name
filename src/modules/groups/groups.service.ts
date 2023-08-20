import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository, EntityManager, Transaction, DataSource } from 'typeorm';
import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { ERROR_RESPONSE } from 'src/common/custom-exceptions';
import { ErrorCustom } from 'src/common/error-custom';

@Injectable()
export class GroupsService {


  constructor(
    @InjectRepository(Group) private readonly groupRepository: Repository<Group>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private dataSource: DataSource
  ) { }

  async createGroups(createGroupDto: CreateGroupDto, idCreate: number) {
    const { name, group_admin_id, members } = createGroupDto;
    const allGroup = await this.findAllGroup()
    const checkGroupAdmin = allGroup.find(group_id => group_id.group_admin_id === group_admin_id)

    if (checkGroupAdmin) {
      throw new ErrorCustom(ERROR_RESPONSE.AdminHasGroup)
    }
    const group = this.groupRepository.create({
      name,
      group_admin_id,
      created_at: new Date(),
      created_by: idCreate,
    });

    const membersToCreate = await this.findUserAddToGroup(members)


    const queryRunner = this.dataSource.createQueryRunner();

    await this.checkUserExits(membersToCreate, members)

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdGroup = await queryRunner.manager.save(group);
      const updatedMembers = membersToCreate.map(member => {
        member.updated_at = new Date();
        member.group_id = createdGroup;
        return member;
      });

      await queryRunner.manager.save(User, updatedMembers);

      await queryRunner.commitTransaction();

      return createdGroup;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new ErrorCustom(ERROR_RESPONSE.InsertDataFailed)
    } finally {
      await queryRunner.release();
    }
  }

  async findAllGroup() {
    try {
      const findAllGroup = await this.groupRepository.find()
      return findAllGroup
    } catch (error) {

    }
  }

  async findUserAddToGroup(members: any) {
    try {
      const membersToCreate = await this.userRepository.find({
        where: {
          id: In(members),
        },
        relations: {
          group_id: true,
        },
        select: ['id', 'name', 'email'],
      });

      return membersToCreate
    } catch (error) {

    }
  }

  checkUserExits(membersToCreate: any, members: any) {
    const arrayUser = membersToCreate.map(user => user.id)
    const checkExits = members.filter(id => !arrayUser.includes(id))
    if (checkExits.length > 0) {
      throw new ErrorCustom(ERROR_RESPONSE.UserNotExits, checkExits.join(', '))
    }

    for (const member of membersToCreate) {
      if (member.group_id) {
        throw new ErrorCustom(ERROR_RESPONSE.MemberHasGroup, member.id)
      }
    }
  }
}
