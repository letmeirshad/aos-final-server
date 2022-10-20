import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HTBetHistoryController } from './ht-bet-history.controller';
import { HTBetHistory } from './ht-bet-history.entity';
import { HTBetHistoryService } from './ht-bet-history.service';
import { Customer } from '../customer/customer.entity';

import { SharedModule } from '../shared/shared.module';

import { HTConfig } from '../ht-config/ht-config.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { HTAdminLedger } from '../ht-admin-ledger/ht-admin-ledger.entity';
import { HTResult } from '../ht-results/ht-results.entity';
import { Admin } from '../admin/admin.entity';
import { HTSlot } from '../ht-slot/ht-slot.entity';
import { HTBetHistoryGateway } from './ht-bet-history.gateway';
import { AuthenticationService } from '../authentication/authentication.service';
import { AuthenticationModule } from '../authentication/authentication.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HTBetHistory,
      HTConfig,
      Customer,
      CustomGame,
      HTAdminLedger,
      HTResult,
      Admin,
      HTSlot,
    ]),
    SharedModule,
  ],
  controllers: [HTBetHistoryController],
  providers: [AuthenticationService, HTBetHistoryService, HTBetHistoryGateway],
})
export class HTBetHistoryModule {}
