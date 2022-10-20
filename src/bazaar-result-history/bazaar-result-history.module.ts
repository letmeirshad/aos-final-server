import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BazaarHistoryController } from './bazaar-result-history.controller';
import { BazaarResultHistory } from './bazaar-result-history.entity';
import { BazaarHistoryService } from './bazaar-result-history.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([BazaarResultHistory]), SharedModule],
  controllers: [BazaarHistoryController],
  providers: [BazaarHistoryService],
})
export class BazaarHistoryModule {}
