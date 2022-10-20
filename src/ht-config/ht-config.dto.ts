import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class HTConfigDTO {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  readonly config_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly start_timing: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly end_timing: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly interval_minutes: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly maximum_bet_amount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  readonly close_before_seconds: number;
}
