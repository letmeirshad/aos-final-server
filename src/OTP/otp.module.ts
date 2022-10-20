import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OTPController } from './otp.controller';
import { OTP } from './otp.entity';
import { OTPService } from './otp.service';
import { Customer } from '../customer/customer.entity';
import { Admin } from '../admin/admin.entity';
import { SharedModule } from '../shared/shared.module';
import { EmailService } from '../shared';


@Module({
  imports: [TypeOrmModule.forFeature([OTP, Customer, Admin]), SharedModule],
  controllers: [OTPController],
  providers: [OTPService, EmailService],
})
export class OTPModule {}
