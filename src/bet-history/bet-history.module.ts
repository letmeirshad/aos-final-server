import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetHistoryController } from './bet-history.controller';
import { BetHistory } from './bet-history.entity';
import { BetHistoryService } from './bet-history.service';
import { Bazaar } from '../bazaar/bazaar.entity';
import { Customer } from '../customer/customer.entity';
import { Paana } from '../paana/paana.entity';
import { Game } from '../game/game.entity';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { SharedModule } from '../shared/shared.module';
import { Result } from '../results/results.entity';
import { ConfigService } from '../configuration/configuration.service';
import { Configuration } from '../configuration/configuration.entity';
import { SingleResult } from '../single-result/single-result.entity';
import { CpPaana } from '../cp-paana/cp-paana.entity';
import { Admin } from '../admin/admin.entity';
import { AdminLedger } from '../admin-ledger/admin-ledger.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { DbVersion } from '../db-version/db-version.entity';
import { Chart } from '../chart/chart.entity';
import { AdminAnalysis } from '../admin-analysis/admin-analysis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BetHistory,
      Bazaar,
      Admin,
      Game,
      Customer,
      Paana,
      BazaarDate,
      Result,
      Configuration,
      DbVersion,
      SingleResult,
      Paana,
      CpPaana,
      AdminLedger,
      CustomerTransaction,
      Chart,
      AdminAnalysis,
    ]),
    SharedModule,
  ],
  controllers: [BetHistoryController],
  providers: [BetHistoryService, BazaarService, ConfigService],
})
export class BetHistoryModule {}
