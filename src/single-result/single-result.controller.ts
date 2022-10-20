import {
  Controller,
  Get,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { SingleResultService } from './single-result.service';
import * as fromShared from '../shared';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('single-result')
export class SingleResultController {
  constructor(private readonly singleResultService: SingleResultService) {}

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const single_results = await this.singleResultService.findAll();
      return fromShared.found(res, single_results);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting single result'),
      );
    }
  }
}
