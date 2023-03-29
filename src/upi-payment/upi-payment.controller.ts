import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UpiPaymentService } from './upi-payment.service';
import {
  UPIDTO,
  AllDataPagination
} from './upi-payment.dto';
import * as fromShared from '../shared';
import { Response } from 'express';
import { classToPlain } from 'class-transformer';
import { TransactionManager, EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('upi-payment')
export class UpiPaymentController {
  constructor(private readonly upiPaymentService: UpiPaymentService) { }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/all')
  // async findAll(@Res() res: Response, @Body() req: Pagination) {
  //   try {
  //     const customers = classToPlain(
  //       await this.upiPaymentService.findByPagination(req),
  //     );
  //     return fromShared.found(res, customers);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in finding customers'),
  //     );
  //   }
  // }

  //Added By Faiz, For Payment Processing, --At 10/11/2022
  //@UseGuards(JwtAuthGuard)
  //@ApiBearerAuth()
  @Post('/UpiPayment')
  async UpiPayment(@Body() req: UPIDTO, @Res() res: Response) {
    try {
      const paymentData = await this.upiPaymentService.UpiPayment(req);
      return fromShared.found(res, paymentData);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in submitting UPI payment'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/list')
  async getAllUpiTransaction(
    @Res() res: Response,
    @Body() req: AllDataPagination,
  ) {
    try {
      const payments = await this.upiPaymentService.allUpiTransactions(req);   
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(
          error,
          'Error in retrieving all upi transactions',
        ),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/getLast10UpiTransaction')
  async getLast10UpiTransaction(
    @Res() res: Response,
    @Body() req: AllDataPagination,
  ) {
    try {
      const payments = await this.upiPaymentService.getLast10UpiTransaction(req);
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(
          error,
          'Error in retrieving customer all transactions',
        ),
      );
    }
  }

  @Post('/SendSms')
  async SendSms(@Res() res: Response) {
    try {
      const paymentData = await this.upiPaymentService.SendSms();
      return fromShared.found(res, paymentData);
    } catch (error) {
      console.log(error)
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in Sms'),
      );
    }
  }

}
