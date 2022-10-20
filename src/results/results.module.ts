import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultController } from './results.controller';
import { Result } from './results.entity';
import { ResultService } from './results.service';
import { SharedModule } from '../shared/shared.module';
import { Bazaar } from '../bazaar/bazaar.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { Paana } from '../paana/paana.entity';
import { CpResult } from '../cp-result/cp-result.entity';
import { BetHistory } from '../bet-history/bet-history.entity';
import { Admin } from '../admin/admin.entity';
import { DbVersion } from '../db-version/db-version.entity';
import { CpPaana } from '../cp-paana/cp-paana.entity';
import { SingleResult } from '../single-result/single-result.entity';
import { CpCombination } from '../cp-combination/cp-combination.entity';
import { MotorCombination } from '../motor-comb/motor-comb.entity';
import { Amount } from '../amount/amount.entity';
import { Game } from '../game/game.entity';
import { BazaarResultHistory } from '../bazaar-result-history/bazaar-result-history.entity';
import { Chart } from '../chart/chart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bazaar,
      Result,
      BazaarDate,
      BazaarResultHistory,
      BetHistory,
      Paana,
      CpResult,
      Admin,
      DbVersion,
      CpPaana,
      SingleResult,
      CpCombination,
      MotorCombination,
      Amount,
      Game,
      Chart,
    ]),
    SharedModule,
  ],
  controllers: [ResultController],
  providers: [BazaarService, ResultService],
})
export class ResultsModule {}
