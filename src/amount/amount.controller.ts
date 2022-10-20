import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AmountService } from './amount.service';
import { AmountDTO } from './amount.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('amount')
export class AmountController {
  constructor(private readonly amountService: AmountService) {}

  @Post('/save')
  async save(@Res() res: Response, @Body() req: AmountDTO) {
    try {
      await this.amountService.save(req);
      fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in saving Amount'),
      );
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const amounts = classToPlain(await this.amountService.findAll());
      return fromShared.found(res, amounts);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Amounts'),
      );
    }
  }
}
