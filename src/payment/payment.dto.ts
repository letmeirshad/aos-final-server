import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  INITITALIZED = 'INITIALIZED',
  INPROGRESS = 'INPROGRESS',
}

export class NewCustPaymentDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;
}

export class NewAdminPaymentDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;
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

export class AllDataPagination extends Pagination {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly payment_cust_id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly payment_bill_id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly full_name: string;
}

export class UpdateStatus {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bill_id: string;
}

export class PaymentAnalysis {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly date: string;
}
