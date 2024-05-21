import { Controller, Get, Post, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/third-parties/guard/jwt-auth.guard';
import { CustomResponse } from '../../common/response_success';
import { SUCCESS_RESPONSE } from '../../common/custom-exceptions';
import { PermissionGuard } from 'src/third-parties/guard/permission.guard';
import { Permissions } from 'src/third-parties/decorators/permission.decorator';
import { PERMISSION } from 'src/common/enum/permission.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserUsedVouchersDTO } from './dto/userUsedVoucher.dto';

@ApiTags('users')
@Controller('api/users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions(PERMISSION.CREATE_MEMBER)
  @Post('create')
  @ApiOperation({ summary: 'Create Users' })

  @ApiResponse({
    status: 200,
    description: 'Successful create',
    // Define your response schema here
    schema: {
      properties: {
        statusCode: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'int' },
            messsage: { type: 'string' }
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    // Define your error response schema here
    schema: {
      properties: {
        code: { type: 'string' },
        status: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async createUser(@Body() createUserDto: CreateUserDto, @Req() request) {
    try {
      await this.usersService.createUser(createUserDto, request.user.id, request.user.role);
      return new CustomResponse(SUCCESS_RESPONSE.AdminCreateSuccess)
    } catch (error) {
      throw error
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post('used')
  async userUsedVouchers(@Body() userUsedVouchersDTO: UserUsedVouchersDTO, @Req() request) {
    await this.usersService.userUseVouchers(request.user.id, userUsedVouchersDTO.Voucher_id)
    return new CustomResponse(SUCCESS_RESPONSE.AdminCreateSuccess)
  }

}
