import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsBoolean,
} from 'class-validator';

export class BazaarDateDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bazaar_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly KO: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly MO: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly KC: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly MC: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly TO: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly TC: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly MDO: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly MDC: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly MNO: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly MNC: boolean;
}

export class MonthDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly month: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly year: number;
}
