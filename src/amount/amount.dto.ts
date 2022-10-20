import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class AmountDTO {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  readonly amount_id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly amount_value: number;

  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  readonly amount_display: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  readonly status: boolean;
}
