import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpiPaymentController } from './upi-payment.controller';
import { UpiPaymentService } from './upi-payment.service';
import { UpiPayment } from './upi-payment.entity';
import { Customer } from '../customer/customer.entity';
import { SharedModule } from '../shared/shared.module';
import { DbVersion } from '../db-version/db-version.entity';
import { AppVersion } from '../app-version/app-version.entity';
import { ConfigService } from '../configuration/configuration.service';
import { Configuration } from '../configuration/configuration.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UpiPayment,
            Customer,
            DbVersion,
            AppVersion,
            Configuration,
        ]),
        SharedModule,
    ],
    controllers: [UpiPaymentController],
    providers: [UpiPaymentService, ConfigService],
})
export class UpiPaymentModule { }
