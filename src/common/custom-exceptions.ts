import { HttpException, HttpStatus } from '@nestjs/common';



type TErrorCode = 'InternalServer' |
    'InsertDataFailed' |
    'QueryDataFailed' |
    'UpdateDataFailed' |
    'DeleteDataFailed' |
    'ExpiredToken' |
    'InvalidEmail' |
    'InvalidPassword' |
    'InvalidUsernamePassword' |
    'AdminExisted' |
    'InvalidToken' |
    'AdminNotExisted' |
    'InvalidNewPassword' |
    'Unauthorized' |
    'InvalidOgscId' |
    'VoucherUsed' |
    'VoucherNotFound' |
    'InvalidParameters' |
    'UserMailNotFound'
    | 'InvalidUsername'
    | 'AdminHasGroup'
    | 'MemberHasGroup'
    | 'UserNotExits'
    | 'ImageIsRequired'
    | 'GroupNotExits'
    | 'ImageFormat'
    | 'FileSizeToLarge'
    | 'UserNotHaveVoucher'
    | 'UserNotHaveGroups'
export interface IErrorResponse {
    statusCode: number;
    code: string;
    message: string;
}
export const ERROR_RESPONSE: Record<TErrorCode, IErrorResponse> = {
    InternalServer: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'A0001',
        message: 'Internal server error',
    },
    InsertDataFailed: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'A0002',
        message: 'Cannot insert data to database',
    },
    QueryDataFailed: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'A0003',
        message: 'Cannot query data to database',
    },
    UpdateDataFailed: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'A0004',
        message: 'Cannot update data to database',
    },
    DeleteDataFailed: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'A0005',
        message: 'Cannot delete data to database',
    },
    ExpiredToken: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0001',
        message: 'Token has expired',
    },
    InvalidEmail: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0002',
        message: 'Email is invalid',
    },
    InvalidPassword: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0003',
        message: 'Password is invalid ',
    },
    InvalidUsernamePassword: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0004',
        message: 'User name or password is incorrect',
    },
    AdminExisted: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0005',
        message: 'Admin is existed',
    },
    InvalidToken: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0006',
        message: 'Token is invalid',
    },
    AdminNotExisted: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0007',
        message: 'Admin is not existed',
    },
    AdminHasGroup: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0007',
        message: 'Admin has groups',
    },
    MemberHasGroup: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0007',
        message: `Member has a group `,
    },
    InvalidNewPassword: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0008',
        message: 'New password is invalid ',
    },
    Unauthorized: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'C0001',
        message: 'Unauthorized',
    },
    InvalidOgscId: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0009',
        message: 'Ogsc id is invalid',
    },
    VoucherUsed: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'D001',
        message: 'Voucher has been used',
    },
    VoucherNotFound: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'D002',
        message: 'Voucher not found',
    },
    InvalidParameters: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0013',
        message: 'Parameters is invalid',
    },
    UserMailNotFound: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'USER_NOT_FOUND',
        message: 'Email not found',
    },
    InvalidUsername: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'B0012',
        message: 'User name is invalid',
    },
    UserNotExits: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'USER_NOT_FOUND',
        message: 'Not found user ',
    },
    ImageIsRequired: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'A0005',
        message: 'Image is required',
    },
    GroupNotExits: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'USER_NOT_FOUND',
        message: 'Not found group: ',
    },
    ImageFormat: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'USER_NOT_FOUND',
        message: 'Only PNG, JPG, and JPEG files are allowed ',
    },
    FileSizeToLarge: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'USER_NOT_FOUND',
        message: 'File size is to large',
    },
    UserNotHaveVoucher: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'D002',
        message: 'User not have voucher',
    },
    UserNotHaveGroups: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'D002',
        message: 'User not have group',
    },
}

type TSuccessCode = 'ResponseSuccess' |
    'AdminLoginSuccess' |
    'AdminLogoutSuccess' |
    'AdminCreateSuccess' |
    'SaveOmronProductWarrantiesSuccess' |
    'AdminRefreshTokenSuccess';

// Define the interface for base success responses
export interface BaseResponse {
    statusCode: number;
    message: string;
}

/// SUCCESSS

export const SUCCESS_RESPONSE: Record<TSuccessCode, BaseResponse> = {
    ResponseSuccess: {
        statusCode: HttpStatus.OK,
        message: 'Success',
    },
    AdminLoginSuccess: {
        statusCode: HttpStatus.OK,
        message: 'Login successfully',
    },
    AdminLogoutSuccess: {
        statusCode: HttpStatus.OK,
        message: 'Logout successfully',
    },

    AdminCreateSuccess: {
        statusCode: HttpStatus.OK,
        message: 'Admin created successfully',
    },
    SaveOmronProductWarrantiesSuccess: {
        statusCode: HttpStatus.OK,
        message: 'Save Omron Product Warranties successfully',
    },
    AdminRefreshTokenSuccess: {
        statusCode: HttpStatus.OK,
        message: 'Admin refresh token successfully',
    },
};




