import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class GameDTO {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  readonly game_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly game_name: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  readonly status: boolean;
}

export class GameAmountDTO {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly game_id: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  readonly status: boolean;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  readonly amounts: number[];
}

export class FileUploadDTO {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
