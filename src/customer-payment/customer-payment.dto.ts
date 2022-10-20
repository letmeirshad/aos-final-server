import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
} from 'class-validator';

export class CancelPaymentDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly cust_payment_id: number;
}

export class CustomerPaymentDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly cust_id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly initiated_amount: number;
}

export class Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}

export class CustomerPaymentPagination extends Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}
export class TransactionReportDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly start_date: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly end_date: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  readonly receiver_email: string;
}
export class AllDataPagination extends Pagination {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly payment_cust_id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly payment_cust_payment_id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly full_name: string;
}
