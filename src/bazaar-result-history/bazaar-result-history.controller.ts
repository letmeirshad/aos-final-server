import {
  Controller,
  BadRequestException,
  Res,
  UseGuards,
  Body,
  Post,
} from '@nestjs/common';
import { BazaarHistoryService } from './bazaar-result-history.service';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BazaarHistoryPaginationDTO } from './bazaar-result-history.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bazaar-history')
export class BazaarHistoryController {
  constructor(private readonly bazaarHistoryService: BazaarHistoryService) {}

  @Post()
  async findAll(@Res() res: Response, @Body() req: BazaarHistoryPaginationDTO) {
    try {
      const bazaarResults = classToPlain(
        await this.bazaarHistoryService.findAll(req),
      );
      return fromShared.found(res, bazaarResults);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bazaar history'),
      );
    }
  }
}
