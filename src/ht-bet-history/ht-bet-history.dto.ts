import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { BetType } from './ht-bet-history.entity';

export class CustomerHistory {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class HTBetHistoryDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  total_amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty({
    enum: BetType,
  })
  @IsOptional()
  @IsEnum(BetType)
  readonly bet_type: BetType;
}

export class MultipleHTBetRequestsDTO {
  @ApiProperty({
    type: HTBetHistoryDTO,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  readonly bets: HTBetHistoryDTO[];
}

export class CancelBetDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly slot_id: string;
}

export class BetHistoryListDTO {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly data_per_page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}
