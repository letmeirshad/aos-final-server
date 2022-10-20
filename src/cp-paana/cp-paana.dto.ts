import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CpPaanaDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly cp_paana_no: string;
}
