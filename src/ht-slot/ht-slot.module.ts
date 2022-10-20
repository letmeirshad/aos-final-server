import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HTSlotController } from './ht-slot.controller';
import { HTSlot } from './ht-slot.entity';
import { HTSlotService } from './ht-slot.service';
import { SharedModule } from '../shared/shared.module';
import { HTConfig } from '../ht-config/ht-config.entity';
import { HTResult } from '../ht-results/ht-results.entity';
import { Customer } from '../customer/customer.entity';
import { HTBetHistory } from '../ht-bet-history/ht-bet-history.entity';
import { HTSlotGateway } from './ht-slot.gateway';
import { AuthenticationService } from '../authentication/authentication.service';
import { Admin } from '../admin/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HTSlot,
      HTConfig,
      HTResult,
      Customer,
      HTBetHistory,
      Admin,
    ]),
    SharedModule,
  ],
  controllers: [HTSlotController],
  providers: [AuthenticationService, HTSlotService, HTSlotGateway],
  exports: [TypeOrmModule],
})
export class HTSlotModule {}
