import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { User } from 'src/users/entities/user.entity';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { ERROR_RESPONSE } from '../../common/custom-exceptions';
import { ErrorCustom } from '../../common/error-custom';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }


  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  async login(email: string, password: string) {
    const dataUser = await this.findOne(email)
    if (!dataUser) {
      throw new ErrorCustom(ERROR_RESPONSE.InvalidEmail)
    }
    const isPasswordValid = await bcrypt.compare(password, (await dataUser).password);

    if (!isPasswordValid) {
      throw new ErrorCustom(ERROR_RESPONSE.InvalidPassword)
    }


    const accessToken = await this.generateAccessToken(email, dataUser.user_id, dataUser.role_id.role_id, dataUser.role_id.role_name);
    const refreshToken = await this.generateRefreshToken(email, dataUser.user_id, dataUser.role_id.role_id, dataUser.role_id.role_name);

    dataUser.last_login = new Date()
    await this.userRepository.save(dataUser)
    return {
      statusCode: 200,
      data: {
        name: dataUser.name,
        user_id: dataUser.user_id,
        user_role: dataUser.role_id.role_name,
        access_token: accessToken,
        refresh_token: refreshToken
      }
    }
  }

  async findOne(email: string) {
    try {
      const infoUser = await this.userRepository.findOne({ relations: { role_id: true }, where: { email } })
      return infoUser
    } catch (error) {
      throw new Error("Database error")
    }
  }


  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  generateAccessToken(email: string, id: number, role: any, role_name: string): Promise<string> {
    const secret: string = process.env.accessToken
    const payload = {
      role,
      email,
      id,
      role_name
    };

    let expiresIn = '1d';
    return this.jwtService.signAsync(payload, {
      expiresIn: expiresIn,
      secret,
    });
  }
  generateRefreshToken(email: string, id: number, role: any, role_name: string): Promise<string> {
    const secret: string = process.env.refreshToken
    const payload = {
      role,
      email,
      id,
      role_name
    };

    let expiresIn = '2h';
    return this.jwtService.signAsync(payload, {
      expiresIn: expiresIn,
      secret,
    });
  }

  async validateToken(token: any): Promise<any> {
    try {
      console.log(token);

      const decoded = this.jwtService.verify(token.accessToken);
      return decoded;
    } catch (error) {
      return null; // Handle token validation error appropriately
    }
  }


  async CheckRolesUser(email: string) {
    try {
      const infoUser = await this.userRepository.findOne({ relations: { role_id: true }, where: { email } })
      return infoUser.role_id.role_name
    } catch (error) {
    }
  }
}
