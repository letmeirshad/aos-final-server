import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundDTO } from './refund.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';
import { TransactionManager, EntityManager } from 'typeorm';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('refund')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post('/save')
  async save(
    @Res() res: Response,
    @Body() req: RefundDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      await this.refundService.refundAmount(req, manager);
      fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in saving Amount'),
      );
    }
  }
}
