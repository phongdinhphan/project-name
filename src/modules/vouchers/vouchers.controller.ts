import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors, Req, Res, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ERROR_RESPONSE, SUCCESS_RESPONSE } from 'src/common/custom-exceptions';
import { ErrorCustom } from 'src/common/error-custom';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { VouchersService } from './vouchers.service';
import { CustomResponse } from 'src/common/response_success';
import { FILE, FILE_SIZE, TYPE_FILE } from 'src/common/enum/file.enum';
import { ApiBearerAuth, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/third-parties/guard/jwt-auth.guard';
import { config } from "../../config";
import { S3 } from "aws-sdk";
import { S3Service } from './s3.service';
import { multerOptionsCreateVouchers, multerOptionsUploadVouchers } from 'src/third-parties/interceptors/create-voucher.interceptor';
import * as nodemailer from 'nodemailer'
import { Cron, CronExpression } from '@nestjs/schedule';
type FileNameCallback = (error: Error | null, filename: string) => void

@ApiTags('vouchers')
@Controller('api/voucher')
@ApiBearerAuth()
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService,
    private readonly s3Service: S3Service,

  ) { }

  @Post('create')
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
  @ApiConsumes('multipart/form-data')
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
  @UseInterceptors(FileInterceptor(FILE.FILE_INTERCEPTOR, multerOptionsCreateVouchers))
  @UseGuards(JwtAuthGuard)
  async create(@Body() createVoucherDto: CreateVoucherDto, @UploadedFile() file: Express.Multer.File, @Req() request) {
    if (!file) {
      throw new ErrorCustom(ERROR_RESPONSE.ImageIsRequired)
    }
    if (file.size > FILE_SIZE.FILE_SIZE_REQUIRE) {
      throw new ErrorCustom(ERROR_RESPONSE.FileSizeToLarge)
    }
    await this.vouchersService.createVoucher(createVoucherDto, file.path, request.user.id)
    return new CustomResponse(SUCCESS_RESPONSE.ResponseSuccess)
  }


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
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(FileInterceptor(FILE.UPLOAD_INTERCEPTOR, multerOptionsUploadVouchers))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() request, @Res() response) {
    const s3 = new S3({
      accessKeyId: config.aws_access_key_id,
      secretAccessKey: config.aws_secret_access_key,
    });
    // Initialize bucket
    await this.s3Service.initBucket(s3);
    const uplaodRes = await this.s3Service.uploadToS3(s3, file);
    if (uplaodRes.success) {
      response.status(200).json(uplaodRes);
    } else {
      response.status(400).json(uplaodRes);
    }
  }

  @Post('send-mail')
  @Cron('10 * * * * *')//  8AM GMT+7 (1H UTC0)
  async sendMailExpiredVouchers() {
    const emailNeededSenmail = await this.vouchersService.checkVoucherUserSendMailExpired()
    await this.vouchersService.sendMailToUser(emailNeededSenmail)
    return new CustomResponse(SUCCESS_RESPONSE.ResponseSuccess)
  }

}
