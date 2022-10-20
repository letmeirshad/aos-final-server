import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { Game } from './game.entity';
import { GameService } from './game.service';
import { Amount } from '../amount/amount.entity';
import { SharedModule } from '../shared/shared.module';
import { DbVersion } from '../db-version/db-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Amount, DbVersion]), SharedModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
