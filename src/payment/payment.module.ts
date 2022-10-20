import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalService } from '../shared';
import { Admin } from '../admin/admin.entity';
import { Customer } from '../customer/customer.entity';
import { SharedModule } from '../shared/shared.module';
import { PaymentController } from './payment.controller';
import { Payment } from './payment.entity';
import { PaymentService } from './payment.service';
import { Configuration } from '../configuration/configuration.entity';
import { ConfigService } from '../configuration/configuration.service';
import { TokenManagerService } from '../token-manager/token-manager.service';
import { TokenManager } from '../token-manager/token-manager.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Admin, Customer, Configuration, TokenManager]), SharedModule],
  controllers: [PaymentController],
  providers: [PaymentService, ExternalService, ConfigService, TokenManagerService],
})
export class PaymentModule {}
