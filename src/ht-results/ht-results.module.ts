import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HTResultController } from './ht-results.controller';
import { HTResult } from './ht-results.entity';
import { HTResultService } from './ht-results.service';

import { SharedModule } from '../shared/shared.module';

import { HTBetHistory } from '../ht-bet-history/ht-bet-history.entity';
import { HTConfig } from '../ht-config/ht-config.entity';
import { HTFloater } from '../ht-floater/ht-floater.entity';
import { Customer } from '../customer/customer.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { HTAdminLedger } from '../ht-admin-ledger/ht-admin-ledger.entity';
import { Admin } from '../admin/admin.entity';
import { HTSlotService } from '../ht-slot/ht-slot.service';
import { HTSlotModule } from '../ht-slot/ht-slot.module';
import { HTResultGateway } from './ht-results.gateway';
import { AuthenticationService } from '../authentication/authentication.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      HTResult,
      HTBetHistory,
      HTConfig,
      HTFloater,
      Customer,
      CustomGame,
      HTAdminLedger,
      Admin,
    ]),
    SharedModule,
    HTSlotModule,
  ],
  controllers: [HTResultController],
  providers: [
    AuthenticationService,
    HTResultService,
    HTSlotService,
    HTResultGateway,
  ],
})
export class HTResultsModule {}
