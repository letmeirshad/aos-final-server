import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsArray } from 'class-validator';

export class SingleResultDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly single_value: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly paana_id: number;
}

export class SingleResults {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  readonly single_results: SingleResultDTO[];
}
