import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  BadRequestException,
  UseGuards,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { BetHistoryService } from './bet-history.service';
import {
  BetHistoryFilterDTO,
  ClaimDTO,
  BetHistoryDetailFilterDTO,
  DashboardDTO,
  MultipleBetRequestsDTO,
  BetPaanaList,
  BetAnalysisDTO,
} from './bet-history.dto';
import * as fromShared from '../shared';
import { TransactionManager, EntityManager } from 'typeorm';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('bet-history')
export class BetHistoryController {
  constructor(private readonly betHistoryService: BetHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/new')
  async create(
    @Res() res: Response,
    @Body() betHistory: MultipleBetRequestsDTO,
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
      fromShared.saved(res, bets.pop());
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating new bet'),
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Res() res: Response) {
    try {
      const bazaars = classToPlain(await this.betHistoryService.findAll());
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bet history'),
      );
    }
  }

  @Post('/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async claimResult(
    @Res() res: Response,
    @Body() body: ClaimDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      const bet = classToPlain(
        await this.betHistoryService.claimBet(body, manager),
      );
      return fromShared.success(res, null, bet);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in claiming bet'),
      );
    }
  }

  @Post('/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCurrentDaysBooking(
    @Res() res: Response,
    @Body() body: DashboardDTO,
  ) {
    try {
      const dashboardData = await this.betHistoryService.getDashboardData(body);
      return fromShared.found(res, dashboardData);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting data'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/bet-list')
  async findByCustomer(
    @Res() res: Response,
    @Body() filter: BetHistoryFilterDTO,
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

  @Post('/detail-bet-list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findDetailBet(
    @Res() res: Response,
    @Body() filter: BetHistoryDetailFilterDTO,
  ) {
    try {
      const bazaars = classToPlain(
        await this.betHistoryService.detailBetList(filter),
      );
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bet history'),
      );
    }
  }

  @Post('/bet-paana-list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findBetPaana(@Res() res: Response, @Body() game: BetPaanaList) {
    try {
      const bazaars = classToPlain(
        await this.betHistoryService.betPaanas(game),
      );
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bet history'),
      );
    }
  }

  @Post('/bet-analysis/:game')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async betAnalysis(
    @Res() res: Response,
    @Body() game: BetAnalysisDTO,
    @Param() params,
  ) {
    try {
      const bazaars = classToPlain(
        await this.betHistoryService.getAnalysis(game, params.game),
      );
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bet history'),
      );
    }
  }

  @Post('/bet-analysis-total')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async betAnalysisTotal(@Res() res: Response, @Body() game: BetAnalysisDTO) {
    try {
      const bazaars = classToPlain(
        await this.betHistoryService.getAnalysisTotal(game),
      );
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bet history'),
      );
    }
  }
}
