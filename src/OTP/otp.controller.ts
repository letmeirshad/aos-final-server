import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  BadRequestException,
  UseGuards,
  Session,
} from '@nestjs/common';
import { OTPService } from './otp.service';
import { OTPDTO, ValidateOTP } from './otp.dto';
import * as fromShared from '../shared';
import { Response } from 'express';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';
import { ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('otp')
export class OTPController {
  constructor(private readonly otpService: OTPService) {}

  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  @Post('/new/customer')
  async createCust(@Body() otp: OTPDTO, @Res() res: Response) {
    try {
      const OTP = await this.otpService.createCust(otp);
      return fromShared.saved(res, OTP);
    } catch (error) {
      throw new BadRequestException('Error in generating OTP');
    }
  }

  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  @Post('/new/admin')
  async createAdmin(
    @Body() otp: OTPDTO,
    @Res() res: Response,
    @Session() session,
  ) {
    try {
      const OTP = await this.otpService.createAdmin(otp);
      return fromShared.saved(res, OTP);
    } catch (error) {
      throw new BadRequestException('Error in generating OTP');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const otps = await this.otpService.findAll();
      return fromShared.found(res, otps);
    } catch (error) {
      throw new BadRequestException('Error in finding OTPs');
    }
  }

  @ApiHeader({ name: 'access-token' })
  @UseGuards(BeforeLoginGuard)
  @Post('/validate/customer')
  async validateCustOTP(
    @Body() validateOTP: ValidateOTP,
    @Res() res: Response,
  ) {
    try {
      const custData = await this.otpService.validateCust(validateOTP);
        return fromShared.saved(res,custData);
      
    } catch (error) {
      throw new BadRequestException('Error Validating OTP');
    }
  }

  @ApiHeader({ name: 'access-token' })
  @UseGuards(BeforeLoginGuard)
  @Post('/validate/admin')
  async validateAdminOTP(
    @Body() validateOTP: ValidateOTP,
    @Res() res: Response,
  ) {
    try {
      const isSucccess = await this.otpService.validateAdmin(validateOTP);
      if (isSucccess) {
        return fromShared.success(res);
      } else {
        throw new BadRequestException('InValid OTP');
      }
    } catch (error) {
      throw new BadRequestException('Error Validating OTP');
    }
  }
}
