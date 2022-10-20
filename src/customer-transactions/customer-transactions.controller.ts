import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CustTransactionsService } from './customer-transactions.service';
import { CustTransactionDTO } from './customer-transactions.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('customer-transactions')
export class CustTransactionsController {
  constructor(private readonly transactionService: CustTransactionsService) {}

  @Post()
  async findCustomerTrxn(
    @Res() res: Response,
    @Body() req: CustTransactionDTO,
  ) {
    try {
      const transactions = classToPlain(
        await this.transactionService.findCustTrxn(req),
      );
      return fromShared.found(res, transactions);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Amounts'),
      );
    }
  }

  @Post('/wallet')
  async findCustomerWalletTrxn(
    @Res() res: Response,
    @Body() req: CustTransactionDTO,
  ) {
    try {
      const transactions = classToPlain(
        await this.transactionService.findWalletTrxn(req),
      );
      return fromShared.found(res, transactions);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Amounts'),
      );
    }
  }
}
