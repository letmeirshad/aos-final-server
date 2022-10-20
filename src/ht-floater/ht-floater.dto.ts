import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';

export class FloaterUpdateDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly floater_id: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly status: boolean;
}
