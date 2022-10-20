import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CustTransactionDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly cust_id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly admin_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly data_per_page: number;

  @ApiPropertyOptional()
  @IsOptional()
  readonly order: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}
