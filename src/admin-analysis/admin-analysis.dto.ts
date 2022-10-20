import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AdminAnalysisDTO {
  @IsString()
  readonly paana_no: string;
  @IsString()
  readonly game_date: string;
  @IsNumber()
  readonly bazaar_id: number;
  @IsNumber()
  readonly game_id: number;
}
