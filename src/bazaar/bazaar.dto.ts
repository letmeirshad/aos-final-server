import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsBoolean,
} from 'class-validator';

export class BazaarDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly bazaar_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bazaar_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  bazaar_image: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly timing: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly close_before: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;
}

export class SingleBazaarDate {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly bazaar_date: string;
}

export class BazaarId {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}
