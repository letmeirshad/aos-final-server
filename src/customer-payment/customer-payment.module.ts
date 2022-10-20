import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustPaymentController } from './customer-payment.controller';
import { CustomerPayment } from './customer-payment.entity';
import { CustPaymentService } from './customer-payment.service';
import { SharedModule } from '../shared/shared.module';
import { Customer } from '../customer/customer.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { Payment } from '../payment/payment.entity';
import { EmailService } from 'src/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerPayment,
      Customer,
      CustomerTransaction,
      Payment,
    ]),
    SharedModule,
  ],
  controllers: [CustPaymentController],
  providers: [CustPaymentService, EmailService],
})
export class CustomerPaymentModule {}
