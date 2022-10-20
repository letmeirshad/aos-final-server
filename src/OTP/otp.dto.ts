import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class OTPDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly mobile_no: string;
}

export class ValidateOTP {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly mobile_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly otp_value: number;
}
