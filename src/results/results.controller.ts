import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ResultService } from './results.service';
import { ResultDTO } from './results.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { TransactionManager, EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post('/save')
  async create(
    @Body() result: ResultDTO,
    @Res() res: Response,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      await this.resultService.save(result, manager);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating result'),
      );
    }
  }

  @Post('/save-admin')
  async createAdmin(
    @Body() result: ResultDTO,
    @Res() res: Response,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      await this.resultService.save(result, manager);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating result'),
      );
    }
  }

  @Get('/get-bazaars')
  async checkCanDeclare(@Res() res: Response) {
    try {
      const bazaarList = await this.resultService.getBazaars();
      return fromShared.found(res, bazaarList);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting bazaar list'),
      );
    }
  }
}
