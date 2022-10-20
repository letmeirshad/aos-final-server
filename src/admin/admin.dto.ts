import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsBoolean,
  MinLength,
  IsNumberString,
  Length,
} from 'class-validator';
import { StrictPassword } from '../shared';

export class AdminDTO {
  // @ApiPropertyOptional()
  // @IsNumber()
  // @IsOptional()
  // admin_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  readonly first_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  readonly last_name: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // readonly points: number;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // readonly deposit: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  // @StrictPassword()
  readonly password: string;

  // @ApiPropertyOptional()
  // @IsBoolean()
  // @IsOptional()
  // readonly status: boolean;

  // @ApiPropertyOptional()
  // @IsBoolean()
  // @IsOptional()
  // readonly is_blocked: boolean;

  // @ApiPropertyOptional()
  // @IsBoolean()
  // @IsOptional()
  // readonly is_first_time: boolean;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // readonly created_by: number;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // readonly updated_by: number;
}

export class ChangePassword {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly old_password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @StrictPassword()
  readonly new_password: string;
}

export class ForgotPassword {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Length(10, 10)
  readonly mobile_no: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly otp_value: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @StrictPassword()
  readonly password: string;
}

export class Points {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;
}

// export class Recharge {
//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly points: number;

//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly admin_giving_id: number;

//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly admin_taking_id: number;
// }

export class CustomerRecharge {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly points: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class Pagination {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly current_page: number;
}

// export class FindAdmin {
//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly current_page: number;

//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly admin_id: number;

//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly role_id: number;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsNumber()
//   readonly admin_role_id: number;
// }

export class ChangeMobileNumber {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly mobile_no: string;
}

export class Payment {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // readonly admin_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class Profile {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;
}

export class Analytics {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class ResetPassCust extends Profile {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

export class ProfileEdit {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly first_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly last_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;
}

export class DeleteCustomer {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly admin_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly cust_id: number;
}

// export class DeleteAdmin {
//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly admin_id: number;

//   @ApiProperty()
//   @IsNotEmpty()
//   @IsNumber()
//   readonly parent_admin_id: number;
// }
