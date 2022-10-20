import {
  Controller,
  Get,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CpCombinationService } from './cp-combination.service';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('cp-combination')
export class CpCombinationController {
  constructor(private readonly cpcomboService: CpCombinationService) {}

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const cp_results = classToPlain(await this.cpcomboService.findAll());
      return fromShared.found(res, cp_results);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding CP Result'),
      );
    }
  }
}
