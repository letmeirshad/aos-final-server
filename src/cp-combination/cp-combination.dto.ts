import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsArray } from 'class-validator';

export class CpCombinationDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly paana_id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly cp_paana_id: number;
}

export class CpCombinations {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  cp_combinations: CpCombinationDTO[];
}
