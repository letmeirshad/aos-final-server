import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BazaarModule } from './bazaar/bazaar.module';
import { SharedModule } from './shared/shared.module';
import { GameModule } from './game/game.module';
import { CustomerModule } from './customer/customer.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { CpCombinationModule } from './cp-combination/cp-combination.module';
import { BetHistoryModule } from './bet-history/bet-history.module';
import { MasterModule } from './master/master.module';
import { AmountModule } from './amount/amount.module';
import { OTPModule } from './OTP/otp.module';
import { CpPaanaModule } from './cp-paana/cp-paana.module';
import { PaanaModule } from './paana/paana.module';
import { ChartModule } from './chart/chart.module';
import { SingleResultModule } from './single-result/single-result.module';
import { MotorCombinationModule } from './motor-comb/motor-comb.module';
import { AdminModule } from './admin/admin.module';
import { DbVersionModule } from './db-version/db-version.module';
import { BazaarDateModule } from './bazaar-date/bazaar-date.module';
import { ResultsModule } from './results/results.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { BazaarHistoryModule } from './bazaar-result-history/bazaar-result-history.module';
import { CustomerTransactionsModule } from './customer-transactions/customer-transactions.module';
import { AdminLedgerModule } from './admin-ledger/admin-ledger.module';
import { ChartResultModule } from './chart-result/chart-result.module';
import { RefundModule } from './refund-policy/refund.module';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { HTConfigModule } from './ht-config/ht-config.module';
import * as path from 'path';
import { RSA } from './shared';
import { LoggerMiddleware } from './shared/middlewares/decryption.middleware';
import { AuthenticationController } from './authentication/authentication.controller';
import { AppVersionModule } from './app-version/app-version.module';
import { HTFloaterModule } from './ht-floater/ht-floater.module';
import { HTResultsModule } from './ht-results/ht-results.module';
import { HTBetHistoryModule } from './ht-bet-history/ht-bet-history.module';
import { HTAdminLedgerModule } from './ht-admin-ledger/ht-admin-ledger.module';
import { HTSlotModule } from './ht-slot/ht-slot.module';
import { CustomGameModule } from './custom-game/custom-game.module';
import { AdminAnalysisModule } from './admin-analysis/admin-analysis.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { CustomerPaymentModule } from './customer-payment/customer-payment.module';
import { TokenManagerModule } from './token-manager/token-manager.module';
import { CountryCodeModule } from './country-code/country-code.module';
@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
    CustomerModule,
    AuthenticationModule,
    BazaarHistoryModule,
    BazaarModule,
    GameModule,
    BetHistoryModule,
    MasterModule,
    SharedModule,
    AmountModule,
    CustomGameModule,
    CpCombinationModule,
    OTPModule,
    CpPaanaModule,
    PaanaModule,
    ChartModule,
    MotorCombinationModule,
    SingleResultModule,
    ResultsModule,
    AdminModule,
    CustomerTransactionsModule,
    DbVersionModule,
    ConfigurationModule,
    AdminLedgerModule,
    BazaarDateModule,
    RefundModule,
    AppVersionModule,
    ChartResultModule,
    HTConfigModule,
    HTFloaterModule,
    HTBetHistoryModule,
    HTAdminLedgerModule,
    HTSlotModule,
    HTResultsModule,
    AdminAnalysisModule,
    OTPModule,
    ChatModule,
    PaymentModule,
    CustomerPaymentModule,
    TokenManagerModule,
    CountryCodeModule
  ],
  controllers: [],
  providers: [],
  exports: [CustomerModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
