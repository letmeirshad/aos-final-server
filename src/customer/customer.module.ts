import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { SharedModule } from '../shared/shared.module';
import { Bazaar } from '../bazaar/bazaar.entity';
import { Admin } from '../admin/admin.entity';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { OTP } from '../OTP/otp.entity';
import { DbVersion } from '../db-version/db-version.entity';
import { Result } from '../results/results.entity';
import { Game } from '../game/game.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { AppVersion } from '../app-version/app-version.entity';
import { ConfigService } from '../configuration/configuration.service';
import { Configuration } from '../configuration/configuration.entity';
import { BetHistory } from '../bet-history/bet-history.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { OTPService } from '../OTP/otp.service';
import { EmailService } from '../shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      DbVersion,
      Game,
      AppVersion,
      Bazaar,
      Admin,
      OTP,
      BazaarDate,
      Configuration,
      Result,
      CustomerTransaction,
      BetHistory,
      CustomGame,
    ]),
    SharedModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService, BazaarService, ConfigService, OTPService, EmailService],
})
export class CustomerModule {}
