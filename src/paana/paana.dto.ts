import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export enum PaanaType {
  SP = 'SP',
  DP = 'DP',
  TP = 'TP',
}

export class PaanaDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly paana_no: string;

  @ApiProperty({
    enum: ['SP', 'DP', 'TP'],
  })
  @IsNotEmpty()
  @IsString()
  readonly paana_type: PaanaType;
}

export class PaanasDTO {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  readonly paanas: Array<PaanaDTO>;
}
