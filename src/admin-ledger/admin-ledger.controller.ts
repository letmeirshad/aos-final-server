import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AdminLedgerService } from './admin-ledger.service';
import { AdminReportDTO } from './admin-ledger.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('admin-ledger')
export class AdminLedgerController {
  constructor(private readonly adminLedgerService: AdminLedgerService) {}

  @Post('/report')
  async getSummarizedReport(@Res() res: Response, @Body() req: AdminReportDTO) {
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

  // @Roles(fromShared.ROLES.SUPER_ADMIN, fromShared.ROLES.ADMIN)
  // @Post('/get-payment')
  // async getPaymentDetails(
  //   @Res() res: Response,
  //   @Body() req: PaymentDetailsDTO,
  // ) {
  //   try {
  //     const paymentDetails = await this.adminLedgerService.getPaymentDetails(
  //       req,
  //     );
  //     return fromShared.found(res, paymentDetails);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in getting payment Details'),
  //     );
  //   }
  // }

  // @Roles(fromShared.ROLES.SUPER_ADMIN, fromShared.ROLES.ADMIN)
  // @Post('/payment-history')
  // async getPaymentHistory(@Res() res: Response, @Body() req: AdminLedgerDTO) {
  //   try {
  //     const ledgers = classToPlain(
  //       await this.adminLedgerService.findPaymetHistory(req),
  //     );
  //     return fromShared.found(res, ledgers);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in finding Payment'),
  //     );
  //   }
  // }

  @Post('/ledger')
  async getLedger(@Res() res: Response, @Body() req) {
    try {
      const ledgers = classToPlain(
        await this.adminLedgerService.findLedger(req),
      );
      return fromShared.found(res, ledgers);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Ledger'),
      );
    }
  }
}
