import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class RefundDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly bazaar_id: number;

  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  readonly bazaar_date: string;
}
