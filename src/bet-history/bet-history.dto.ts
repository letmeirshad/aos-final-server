import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumberString,
} from 'class-validator';
import { PaanaType } from '../paana/paana.entity';

export class BetPaanaDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  readonly selected_paana: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount_per_paana: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly total_amount: number;

  @ApiProperty({
    enum: PaanaType,
  })
  @IsOptional()
  @IsEnum(PaanaType)
  readonly paana_type: PaanaType;
}

export class CustomerHistory {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class BetHistoryDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly bazaar_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly game_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly game_date: string;

  @ApiProperty({
    type: BetPaanaDTO,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  readonly paanas: Array<BetPaanaDTO>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly status: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly created_by: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly updated_by: number;
}

export class MultipleBetRequestsDTO {
  @ApiProperty({
    type: BetHistoryDTO,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  readonly bets: BetHistoryDTO[];
}

export class BetHistoryFilterDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly game_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly bazaar_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly game_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly cust_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly data_per_page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}

export class BetHistoryDetailFilterDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly game_date: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly bazaar_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly game_id: number;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  readonly paanas: [string];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly cust_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  readonly data_per_page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;
}

export class ClaimDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly bet_id: number;
}
export class BetPoints {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly game_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly game_date: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly bazaar_id: number;
}

export class BetPaanaList extends BetPoints {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;
}

export class BetAnalysisDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly game_date: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly bazaar_id: number;
}

export class DashboardDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly game_date: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  readonly admin_id: number;
}
