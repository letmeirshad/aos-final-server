import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundController } from './refund.controller';
import { RefundPolicy } from './refund-policy.entity';
import { RefundService } from './refund.service';
import { SharedModule } from '../shared/shared.module';
import { BetHistory } from '../bet-history/bet-history.entity';
import { Admin } from '../admin/admin.entity';
import { Customer } from '../customer/customer.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { AdminLedger } from '../admin-ledger/admin-ledger.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { Bazaar } from '../bazaar/bazaar.entity';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { Result } from '../results/results.entity';
import { DbVersion } from '../db-version/db-version.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefundPolicy,
      BetHistory,
      Admin,
      Customer,
      CustomerTransaction,
      AdminLedger,
      Bazaar,
      BazaarDate,
      DbVersion,
      Result,
    ]),
    SharedModule,
  ],
  controllers: [RefundController],
  providers: [RefundService, BazaarService],
})
export class RefundModule {}
