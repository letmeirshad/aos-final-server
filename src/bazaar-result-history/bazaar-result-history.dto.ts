import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class BazaarHistoryPaginationDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly data_per_page: number;
}
