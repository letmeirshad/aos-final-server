import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterController } from './master.controller';
import { Bazaar } from './../bazaar/bazaar.entity';
import { Game } from './../game/game.entity';
import { MasterService } from './master.service';
import { Paana } from '../paana/paana.entity';
import { CpPaana } from '../cp-paana/cp-paana.entity';
import { MotorCombination } from '../motor-comb/motor-comb.entity';
import { DbVersion } from '../db-version/db-version.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { SharedModule } from '../shared/shared.module';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { Result } from '../results/results.entity';
import { SingleResult } from '../single-result/single-result.entity';
import { CpCombination } from '../cp-combination/cp-combination.entity';
import { Amount } from '../amount/amount.entity';
import { Configuration } from '../configuration/configuration.entity';
import { AppVersion } from '../app-version/app-version.entity';
import { Chart } from '../chart/chart.entity';
import { CustomGame } from '../custom-game/custom-game.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bazaar,
      Game,
      Paana,
      CpPaana,
      MotorCombination,
      DbVersion,
      BazaarDate,
      Result,
      AppVersion,
      Configuration,
      SingleResult,
      CpCombination,
      Amount,
      Chart,
      CustomGame,
    ]),
    SharedModule,
  ],
  controllers: [MasterController],
  providers: [MasterService, BazaarService],
})
export class MasterModule {}
