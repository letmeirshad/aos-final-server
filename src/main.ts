import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import * as compression from 'compression';
import * as session from 'express-session';
import * as pg from 'pg';
import * as fromShared from './shared';
import * as passport from 'passport';
import { AmountModule } from './amount/amount.module';
import { BazaarModule } from './bazaar/bazaar.module';
import { BetHistoryModule } from './bet-history/bet-history.module';
import { CpPaanaModule } from './cp-paana/cp-paana.module';
import { CpCombinationModule } from './cp-combination/cp-combination.module';
import { GameModule } from './game/game.module';
import { PaanaModule } from './paana/paana.module';
import { SingleResultModule } from './single-result/single-result.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { CustomerModule } from './customer/customer.module';
import { OTPModule } from './OTP/otp.module';
import { MasterModule } from './master/master.module';
import { MotorCombinationModule } from './motor-comb/motor-comb.module';
import { AdminModule } from './admin/admin.module';
import { DbVersionModule } from './db-version/db-version.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BazaarDateModule } from './bazaar-date/bazaar-date.module';
import { ResultsModule } from './results/results.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { BazaarHistoryModule } from './bazaar-result-history/bazaar-result-history.module';
import { CustomerTransactionsModule } from './customer-transactions/customer-transactions.module';
import { AdminLedgerModule } from './admin-ledger/admin-ledger.module';
import { SessionsModule } from './sessions/sessions.module';
import { RefundModule } from './refund-policy/refund.module';
import { ChartModule } from './chart/chart.module';
import { HTConfigModule } from './ht-config/ht-config.module';
import { HTFloaterModule } from './ht-floater/ht-floater.module';
import { CustomGameModule } from './custom-game/custom-game.module';
import { HTSlotModule } from './ht-slot/ht-slot.module';
import { AppVersionModule } from './app-version/app-version.module';
import { ChartResultModule } from './chart-result/chart-result.module';
import { HTBetHistoryModule } from './ht-bet-history/ht-bet-history.module';
import { HTAdminLedgerModule } from './ht-admin-ledger/ht-admin-ledger.module';
import { HTResultsModule } from './ht-results/ht-results.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { CustomerPaymentModule } from './customer-payment/customer-payment.module';
import { CountryCodeModule } from './country-code/country-code.module';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // cors:{
    //   credentials: true,
    // methods: ['GET', 'POST'],
    // origin: 'http://localhost:4200',
    // allowedHeaders: ['Content-Type', 'Authorization', 'access-token']
    // },
    // logger: new fromShared.MyLogger(),
  });

  const pgPool = new pg.Pool({
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.SSL === 'true',
  });

  app.enableCors();

  app.use([
    helmet(),
    compression(),
    // rateLimit({
    //   windowMs: 1000,
    //   max: 1000,
    // }),
    // session({
    //   store: new pgSession({
    //     pruneSessionInterval: 1,
    //     pool: pgPool,
    //   }),
    //   // proxy: true,
    //   // cookie:{
    //   //   // sameSite: true,
    //   //   httpOnly: true,
    //   //   secure: true,
    //   //   signed: true
    //   // },
    //   secret: process.env.SESSION_SECRET,
    //   resave: true,
    //   name: 'sid',
    //   saveUninitialized: false,
    //   unset: 'destroy',
    // }),
    passport.initialize(),
    // passport.session()
  ]);

  app.useGlobalPipes(
    new ValidationPipe({
      validationError: {
        target: true,
        value: true,
      },
      disableErrorMessages: false,
      transform: true,
      exceptionFactory: errors => new BadRequestException('Validation Error'),
    }),
  );

  app.useGlobalFilters(new fromShared.ExceptionsFilter());
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.useStaticAssets(join(__dirname, '..', 'policy'), {
    prefix: '/policies',
  });

  app.useStaticAssets(join(__dirname, '..', 'apk'), {
    prefix: '/apk',
  });

  if (process.env.PRODUCTION === 'false') {
    const adminApiOptions = new DocumentBuilder()
      .setTitle('Matka APP')
      .setDescription('The API description')
      .setVersion('1.0')
      .addTag('Matka-Admin-API')
      .addBearerAuth()
      .build();

    const adminDocument = SwaggerModule.createDocument(app, adminApiOptions, {
      include: [
        CustomerModule,
        AuthenticationModule,
        BazaarHistoryModule,
        BazaarModule,
        GameModule,
        BetHistoryModule,
        MasterModule,
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
        // RefundModule,
        // CustomerBonusModule,
        // AppVersionModule,
        // ChartResultModule,
        HTConfigModule,
        HTFloaterModule,
        HTBetHistoryModule,
        HTAdminLedgerModule,
        HTSlotModule,
        HTResultsModule,
        ChatModule,
        PaymentModule,
        CustomerPaymentModule,
        CountryCodeModule
      ],
    });
    SwaggerModule.setup('api', app, adminDocument);
  }

  await app.listen(+process.env.PORT || 5000);
}
bootstrap();
