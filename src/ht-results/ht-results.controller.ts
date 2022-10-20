import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { HTResultService } from './ht-results.service';
import { Response } from 'express';
import * as fromShared from '../shared';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';
import { SlotResultDTO } from './ht-results.dto';

@Controller('ht-results')
export class HTResultController {
  constructor(private readonly resultService: HTResultService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  async find(@Res() res: Response) {
    try {
      const results = await this.resultService.findAll();
      fromShared.found(res, results);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding results'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async getResult(@Body() body: SlotResultDTO, @Res() res: Response) {
    try {
      const result = await this.resultService.getSlotResult(body);
      fromShared.found(res, result);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding result'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/analysis')
  async getAnalysis(@Res() res: Response) {
    try {
      const result = await this.resultService.getAnalysis();
      fromShared.found(res, result);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding analysis'),
      );
    }
  }
}
