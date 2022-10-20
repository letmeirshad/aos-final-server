import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CustAuth {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  auth_user_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  auth_user_password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  device_id: string;
}

export class AdminAuth {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  auth_user_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  auth_user_password: string;
}

export class LogOut {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly device_id: string;
}
