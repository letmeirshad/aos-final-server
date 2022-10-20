import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { HTAdminLedgerService } from './ht-admin-ledger.service';
import { HTAdminReportDTO } from './ht-admin-ledger.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('ht-admin-ledger')
export class HTAdminLedgerController {
  constructor(private readonly adminLedgerService: HTAdminLedgerService) {}

  @Post('/report')
  async getSummarizedReport(
    @Res() res: Response,
    @Body() req: HTAdminReportDTO,
  ) {
    try {
      const ledgers = classToPlain(
        await this.adminLedgerService.findReport(req),
      );
      return fromShared.found(res, ledgers);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Reports'),
      );
    }
  }

  @Post('/payment-history')
  async getPaymentHistory(@Res() res: Response) {
    try {
      const ledgers = classToPlain(
        await this.adminLedgerService.findPaymetHistory(),
      );
      return fromShared.found(res, ledgers);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Payment'),
      );
    }
  }

  @Post('/get-payment')
  async getPaymentDetails(@Res() res: Response) {
    try {
      const paymentDetails = await this.adminLedgerService.getPaymentDetails();
      return fromShared.found(res, paymentDetails);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting payment Details'),
      );
    }
  }

  @Post('/ledger')
  async getLedger(@Res() res: Response) {
    try {
      const ledgers = classToPlain(await this.adminLedgerService.findLedger());
      return fromShared.found(res, ledgers);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Ledger'),
      );
    }
  }
}
