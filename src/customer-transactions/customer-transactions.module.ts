import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustTransactionsController } from './customer-transactions.controller';
import { CustomerTransaction } from './customer-transactions.entity';
import { CustTransactionsService } from './customer-transactions.service';
import { SharedModule } from '../shared/shared.module';
import { Customer } from '../customer/customer.entity';
import { Admin } from '../admin/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerTransaction, Customer, Admin]),
    SharedModule,
  ],
  controllers: [CustTransactionsController],
  providers: [CustTransactionsService],
})
export class CustomerTransactionsModule {}
