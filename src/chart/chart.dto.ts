import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class ChartDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly chart_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly game_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly single_value: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly chart_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly paana_no: string;
}

export class ChartsDTO {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  readonly paanas: Array<ChartDTO>;
}

export class FileUploadDTO {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
