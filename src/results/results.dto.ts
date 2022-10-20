import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class ResultDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly res_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly bazaar_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly game_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly result_paana: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly final: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly result_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly result_single_value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly admin_id: number;
}
