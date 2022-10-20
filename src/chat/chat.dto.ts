import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class NewCustChatDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly message: string;
}

export class NewAdminChatDTO {
  

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly message: string;
}

export class Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}

export class CustomerChatPagination extends Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class ReadStatus {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}
