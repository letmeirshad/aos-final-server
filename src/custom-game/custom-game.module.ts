import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomGameController } from './custom-game.controller';
import { CustomGame } from './custom-game.entity';
import { CustomGameService } from './custom-game.service';
import { Amount } from '../amount/amount.entity';
import { SharedModule } from '../shared/shared.module';
import { DbVersion } from '../db-version/db-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomGame, Amount, DbVersion]),
    SharedModule,
  ],
  controllers: [CustomGameController],
  providers: [CustomGameService],
})
export class CustomGameModule {}
