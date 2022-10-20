import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ConfigurationDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly config_id: number;

  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  readonly config_key: string;

  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  readonly config_value: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly display_value: string;
}
