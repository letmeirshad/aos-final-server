import {
  Controller,
  Get,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DbVersionService } from './db-version.service';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('db-version')
export class DbVersionController {
  constructor(private readonly dbService: DbVersionService) {}

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const amounts = classToPlain(await this.dbService.findAll());
      return fromShared.found(res, amounts);
    } catch (error) {
      throw new BadRequestException('Error in finding Amounts');
    }
  }
}
