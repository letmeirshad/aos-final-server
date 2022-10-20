import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class MotorCombinationDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly paana_count: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly sp_comb: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly dp_comb: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly tp_comb: number;
}
