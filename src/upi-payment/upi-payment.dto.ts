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

//Added By Faiz, For Payment Processing, --At 10/11/2022
export class UPIDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly transaction_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly transaction_type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount_point: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly upi_provider: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly date_time: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly upi_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly device_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly mobile_no: string;
}

export class Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}

export class AllDataPagination extends Pagination {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly cust_id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly full_name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly mobile_no: string;
}