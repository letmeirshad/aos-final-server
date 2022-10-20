import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { JwtStrategy } from './jwt.strategy';
import { Customer } from './../customer/customer.entity';
import { Admin } from '../admin/admin.entity';
import { SessionSerializer } from './session.serializer';
import { Session } from '../sessions/sessions.entity';
import * as fromShared from './../shared';
import { ConfigService } from '../configuration/configuration.service';
import { Configuration } from '../configuration/configuration.entity';
import { ConfigModule } from 'nestjs-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Admin, Session, Configuration]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (ConfigService: ConfigService) => ({
        secret: '.l*903wagj9ut34@y0prt5iuwehj',
        signOptions: {
          expiresIn: '15d',
        },
      }),
    }),
  ],

  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    JwtStrategy,
    fromShared.HashingService,
    fromShared.RSA,
    SessionSerializer,
    ConfigService,
  ],
})
export class AuthenticationModule {}
