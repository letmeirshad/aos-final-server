import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumberString,
  Length,
  MinLength,
  IsEmail,
} from 'class-validator';
import { StrictPassword } from '../shared';

export class CustomerDTO {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly first_name: string;

  @ApiProperty()
  @IsString()
  readonly last_name: string;

  @ApiProperty()
  @IsString()
  readonly device_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  //@IsNotEmpty()
  @IsOptional()
  @IsString()
  dob: string;

  @ApiProperty()
  //@IsNotEmpty()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  country_code: string; 
}

export class CustomerUpdateDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly first_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly last_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  readonly email: string;
}

export class ChangePassword {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly old_password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @StrictPassword()
  readonly new_password: string;
}

export class ForgotPassword {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly otp_value: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly password: string;
}

export class ForgotPasswordRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;
}

export class ProfileImage {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly profile_image: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class Points {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly points: number;
}

export class Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}

export class Profile {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class InititalData {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}

export class VerifyDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly mobile_no: string;
}

export class KYCDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly account_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly account_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly account_type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bank_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly branch_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly ifsc_code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}