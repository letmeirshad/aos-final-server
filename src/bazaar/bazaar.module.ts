import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BazaarController } from './bazaar.controller';
import { Bazaar } from './bazaar.entity';
import { BazaarService } from './bazaar.service';
import { SharedModule } from '../shared/shared.module';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { Result } from '../results/results.entity';
import { Game } from '../game/game.entity';
import { DbVersion } from '../db-version/db-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bazaar, BazaarDate, Result, Game, DbVersion]),
    SharedModule,
  ],
  controllers: [BazaarController],
  providers: [BazaarService],
})
export class BazaarModule {}
