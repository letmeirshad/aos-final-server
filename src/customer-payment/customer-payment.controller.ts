import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import { CustPaymentService } from './customer-payment.service';
import {
  AllDataPagination,
  CancelPaymentDTO,
  CustomerPaymentDTO,
  CustomerPaymentPagination,
  TransactionReportDTO,
} from './customer-payment.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EntityManager, TransactionManager } from 'typeorm';
import { createReadStream } from 'fs';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('customer-payment')
export class CustPaymentController {
  constructor(private readonly paymentService: CustPaymentService) {}

  @Post('/inititate')
  async newPayment(
    @Res() res: Response,
    @Body() req: CustomerPaymentDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      const updatedAmount = await this.paymentService.newPaymentRequest(
        req,
        manager,
      );
      return fromShared.found(res, updatedAmount);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Amounts'),
      );
    }
  }

  @Post('/cancel')
  async cancelPayment(
    @Res() res: Response,
    @Body() req: CancelPaymentDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      const updatedAmount = await this.paymentService.cancelPaymentRequest(
        req,
        manager,
      );

      return fromShared.found(res, updatedAmount);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Amounts'),
      );
    }
  }

  @Post('/all')
  async getAllCustomerTransaction(
    @Res() res: Response,
    @Body() req: CustomerPaymentPagination,
  ) {
    try {
      const payments = await this.paymentService.allCustomerTransactions(req);
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(
          error,
          'Error in retrieving all customer transactions',
        ),
      );
    }
  }

  @Post('/list')
  async getAllTransaction(
    @Res() res: Response,
    @Body() req: AllDataPagination,
  ) {
    try {
      const payments = await this.paymentService.allTransactions(req);
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(
          error,
          'Error in retrieving all customer transactions',
        ),
      );
    }
  }

  @Post('/transaction-report')
  async getTransactionReport(
    @Res() res: Response,
    @Body() req: TransactionReportDTO,
  ) {
    try {
      await this.paymentService.sendReport(req);

      fromShared.found(res, 'Sent Sucessfully');
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        fromShared.formatError(
          error,
          'Error in retrieving all customer transactions',
        ),
      );
    }
  }

  @Post('/mark-transaction')
  async markTransaction(
    @Res() res: Response,
    @Body() req: TransactionReportDTO,
  ) {
    try {
      await this.paymentService.markReport(req);

      fromShared.found(res, 'Marked Successfully ');
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        fromShared.formatError(
          error,
          'Error in retrieving all customer transactions',
        ),
      );
    }
  }
}
