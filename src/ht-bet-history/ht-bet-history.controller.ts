import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { HTBetHistoryService } from './ht-bet-history.service';
import {
  HTBetHistoryDTO,
  CancelBetDTO,
  MultipleHTBetRequestsDTO,
  CustomerHistory,
  BetHistoryListDTO,
} from './ht-bet-history.dto';
import * as fromShared from '../shared';
import { TransactionManager, EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { classToPlain } from 'class-transformer';

@Controller('ht-bet-history')
export class HTBetHistoryController {
  constructor(private readonly betHistoryService: HTBetHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/new')
  async create(
    @Res() res: Response,
    @Body() betHistory: MultipleHTBetRequestsDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      const bets = [];
      for (let i = 0; i < betHistory.bets.length; i++) {
        const bet = await this.betHistoryService.create(
          betHistory.bets[i],
          manager,
        );
        bets.push(bet);
      }

      const dta = {
        slot: bets[0].slot,
        points: bets.length > 1 ? bets[1].points : bets[0].points,
        bets: bets,
      };
      return fromShared.saved(res, dta);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating new bet'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/cancel')
  async cancel(
    @Res() res: Response,
    @Body() cancelBet: CancelBetDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      const bet = await this.betHistoryService.cancel(cancelBet, manager);

      return fromShared.saved(res, bet);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in cancelling'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/ht-bet-list')
  async findByCustomer(
    @Res() res: Response,
    @Body() filter: BetHistoryListDTO,
  ) {
    try {
      const bazaars = classToPlain(
        await this.betHistoryService.betList(filter),
      );
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bet history'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/cancel')
  // async status(
  //   @Res() res: Response,
  //   @Body() betHistory: BetHistoryDTO,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     const bet = await this.betHistoryService.create(betHistory, manager);

  //     fromShared.saved(res, bet);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in creating new bet'),
  //     );
  //   }
  // }
}
