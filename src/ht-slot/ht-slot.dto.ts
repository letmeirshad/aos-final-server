import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class HTSlotDTO {
  readonly slot_no: string;
}

export class InitialDataDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly cust_id: number;
}
