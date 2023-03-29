import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CustomerDTO,
  ChangePassword,
  CustomerUpdateDTO,
  ProfileImage,
  Pagination,
  ForgotPassword,
  Profile,
  InititalData,
  VerifyDTO,
  KYCDTO,
  ForgotPasswordRequest,
} from './customer.dto';
import * as fromShared from '../shared';
import { Response } from 'express';
import { classToPlain } from 'class-transformer';
import { TransactionManager, EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update')
  async update(@Body() customer: CustomerUpdateDTO, @Res() res: Response) {
    try {
      await this.customerService.update(customer);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating details'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update-image')
  async updateImage(@Body() body: ProfileImage, @Res() res: Response) {
    try {
      const image = await this.customerService.updateImage(body);
      return fromShared.success(res, image);
    } catch (error) {
      throw new BadRequestException('Error in creating new customer');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/all')
  async findAll(@Res() res: Response, @Body() req: Pagination) {
    try {
      const customers = classToPlain(
        await this.customerService.findByPagination(req),
      );
      return fromShared.found(res, customers);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding customers'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/store')
  async findAllStore(@Res() res: Response, @Body() req: Pagination) {
    try {
      const customers = classToPlain(
        await this.customerService.findByPagination(req, true),
      );
      return fromShared.found(res, customers);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding customers'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/points')
  async findPoints(@Res() res: Response, @Body() req) {
    try {
      const points = await this.customerService.getPoints(req.id);
      return fromShared.success(res, null, points);
    } catch (error) {
      throw new BadRequestException('Error in getting Points');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/initial-data')
  async sendInititalData(@Res() res: Response, @Body() req: InititalData) {
    try {
      const initialData = await this.customerService.getInitialSetup(req.id);
      return fromShared.found(res, initialData);
    } catch (error) {

      console.log(error);
      
      throw new BadRequestException('Error in getting initial data');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/change-password')
  async changePassword(
    @Res() res: Response,
    @Body() changePass: ChangePassword,
  ) {
    try {
      await this.customerService.changePassword(changePass);
      return fromShared.success(res, 'Password changed Sucessfully');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in changing password'),
      );
    }
  }

  @UseGuards(BeforeLoginGuard)
  @Post('/forgot-password')
  @ApiHeader({ name: 'access-token' })
  async forgotPassword(
    @Res() res: Response,
    @Body() forgotPass: ForgotPassword,
  ) {
    try {
      await this.customerService.forgotPassword(forgotPass);
      return fromShared.success(res, 'Password changed Sucessfully');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in changing password'),
      );
    }
  }

  @UseGuards(BeforeLoginGuard)
  @Post('/forgot-password-request')
  @ApiHeader({ name: 'access-token' })
  async forgotPasswordRequest(
    @Res() res: Response,
    @Body() forgotPass: ForgotPasswordRequest,
  ) {
    try {
      await this.customerService.forgotPasswordRequest(forgotPass);
      return fromShared.success(res, 'OTP sent Successfully');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in changing password'),
      );
    }
  }

  @UseGuards(BeforeLoginGuard)
  @Post('/verify-account')
  @ApiHeader({ name: 'access-token' })
  async verifyAccount(@Res() res: Response, @Body() req: VerifyDTO) {
    try {
      const cust = await this.customerService.verify(req);
      return fromShared.success(res, cust);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in verifying Number'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/profile')
  async profile(@Body() profile: Profile, @Res() res: Response) {
    try {
      const profiles = await this.customerService.profile(profile);
      return fromShared.saved(res, profiles);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting profile'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update-kyc')
  async updateKYC(@Body() req: KYCDTO, @Res() res: Response) {
    try {
      const customerData = await this.customerService.updateKYC(req);
      return fromShared.found(res, customerData);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating kyc'),
      );
    }
  }
}
