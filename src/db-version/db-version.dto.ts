import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DbVersionDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly db_version: string;
}
