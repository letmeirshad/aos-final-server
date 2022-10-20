import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';
import { SharedModule } from '../shared/shared.module';
import { Customer } from '../customer/customer.entity';
import { OTP } from '../OTP/otp.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { ConfigService } from '../configuration/configuration.service';
import { Configuration } from '../configuration/configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      Customer,
      OTP,
      CustomerTransaction,
      Configuration,
    ]),
    SharedModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, ConfigService],
})
export class AdminModule {}
