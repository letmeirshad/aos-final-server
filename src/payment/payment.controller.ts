import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../authentication/auth.guard';
import {
  NewAdminPaymentDTO,
  NewCustPaymentDTO,
  CustomerPaymentPagination,
  Pagination,
  UpdateStatus,
  AllDataPagination,
  PaymentAnalysis,
} from './payment.dto';
import { PaymentService } from './payment.service';
import * as fromShared from '../shared';
import { EntityManager, TransactionManager } from 'typeorm';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/customer')
  async newCustomerPayment(
    @Res() res: Response,
    @Body() newPayment: NewCustPaymentDTO,
  ) {
    try {
      const bill = await this.paymentService.newCustomerPayment(newPayment);
      fromShared.found(res, bill);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in new customer chat'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/new/admin')
  // async createAdminChat(
  //   @Res() res: Response,
  //   @Body() newChat: NewAdminChatDTO,
  // ) {
  //   try {
  //     await this.chatService.newAdminChat(newChat);
  //     fromShared.success(res);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in new admin chat'),
  //     );
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/customers/all')
  async getAllCustomerTransaction(
    @Res() res: Response,
    @Body() req: CustomerPaymentPagination,
  ) {
    try {
      const payments = await this.paymentService.getCustomerTransaction(req);
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/all')
  async getAllTransaction(
    @Res() res: Response,
    @Body() req: AllDataPagination,
  ) {
    try {
      const payments = await this.paymentService.allTransactions(req);
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in retrieving all transactions'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/transaction-status')
  async getTransactionStatus(@Res() res: Response, @Body() req: UpdateStatus) {
    try {
      const payments = await this.paymentService.getTransactionStatus(req);
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in retrieving all transactions'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update-transaction-status')
  async updateTransactionStatus(
    @Res() res: Response,
    @Body() req: UpdateStatus,
  ) {
    try {
      const payments = await this.paymentService.updateStatusAdmin(req);
      fromShared.found(res, payments);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in retrieving all transactions'),
      );
    }
  }

  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  @Post('/save')
  async updateStatus(
    @Res() res: Response,
    @Body() update: UpdateStatus,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      await this.paymentService.updateStatus(update, manager);
      fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating  payment status'),
      );
    }
  }

  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  @Post('/analysis')
  async getAnalysis(@Res() res: Response, @Body() req: PaymentAnalysis) {
    try {
      const report = await this.paymentService.analysis(req);
      fromShared.saved(res, report);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating  payment status'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/thread')
  // async getSingleThread(
  //   @Res() res: Response,
  //   @Body() getThread: CustomerChatPagination,
  // ) {
  //   try {
  //     await this.chatService.getChat(getThread);
  //     fromShared.saved(res);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in retrieving all chat'),
  //     );
  //   }
  // }
}
