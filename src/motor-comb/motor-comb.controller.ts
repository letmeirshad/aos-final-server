import {
  Controller,
  Get,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { MotorCombinationService } from './motor-comb.service';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('motor-comb')
export class MotorCombinationController {
  constructor(private readonly motorCombService: MotorCombinationService) {}

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const motor_combs = classToPlain(await this.motorCombService.findAll());
      return fromShared.found(res, motor_combs);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Motor Combinations'),
      );
    }
  }
}
