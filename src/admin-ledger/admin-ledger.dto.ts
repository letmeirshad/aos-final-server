import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class AdminReportDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly ledger_date: string;
}
