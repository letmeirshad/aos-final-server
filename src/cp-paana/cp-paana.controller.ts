import {
  Controller,
  Get,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CpPaanaService } from './cp-paana.service';

import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('cp-paana')
export class CpPaanaController {
  constructor(private readonly cpPaanaService: CpPaanaService) {}

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const paanas = classToPlain(await this.cpPaanaService.findAll());
      return fromShared.found(res, paanas);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding CP Paanas'),
      );
    }
  }
}
