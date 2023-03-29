import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OTP } from './otp.entity';
import { OTPDTO, ValidateOTP } from './otp.dto';
import { Customer } from '../customer/customer.entity';
import * as fromShared from './../shared';
import { Admin } from '../admin/admin.entity';
import { classToPlain } from 'class-transformer';
import { Configuration } from '../shared/utilities/configuration';
//import { Fast2Sms } from 'fast-two-sms';
@Injectable()
export class OTPService {
  constructor(
    @InjectRepository(OTP)
    private readonly otpRepository: Repository<OTP>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    // private readonly smsService: fromShared.SMSService,
    private readonly emailService: fromShared.EmailService
  ) { }

  async createCust(otp: OTPDTO) {
    const customer = await this.customerRepository.findOneOrFail({
      where: {
        mobile_no: otp.mobile_no,
      },
    });

    const newOTP = new OTP();
    newOTP.otp_value = Math.floor(100000 + Math.random() * 900000);
    newOTP.otp_expiration = fromShared.Time.getOTPExpirationTime();
    newOTP.customer = customer;
    const savedOTP = await this.otpRepository.save(newOTP);

    //Added By Faiz, --At 25/11/2022
    // if (customer.mobile_no) {
    //   const smsres = await Fast2Sms.sendMessage({ authorization: process.env.SMS_API_KEY, message: '1000', numbers: [customer.mobile_no] })
    // }

    //Commented By Faiz, --At 25/11/2022

    //   if(customer.email){
    //   const mailOptions = {
    //     from: process.env.EMAIL_ID,
    //     to: customer.email,
    //     subject: 'OTP Generated - Pinnacle Matka',
    //     html: `<div>
    //     <p>Hi ${customer.first_name} ${customer.last_name},</p>
    //     <br/>
    //     <p>Your One Time Password is <b>${newOTP.otp_value}</b> and is valid for ${Configuration.OTP_EXPIRY_TIME} minutes.</p>
    //     <br/>
    //     <p>This email is automatically generated.</p>
    //     <p>Please do not reply to this email.</p>
    //     <br/>
    //     <p>Please do not share this OTP with anyone. Sharing thses details can lead to unauthorised access to your account</p>
    //     <br/>
    //     <p>Regards,</p>
    //     <p>Pinnacle Matka </p>
    //     </div>`,
    //   }
    //   await this.emailService.sendEmail(mailOptions).catch(e => { throw fromShared.compose('Error while sending Email')});
    // }

  }

  async createAdmin(otp: OTPDTO) {
    const admin = await this.adminRepository.findOneOrFail({
      where: {
        mobile_no: otp.mobile_no,
      },
    });

    const newOTP = new OTP();
    newOTP.otp_value = Math.floor(100000 + Math.random() * 900000);
    newOTP.otp_expiration = fromShared.Time.getOTPExpirationTime();
    newOTP.admin = admin;
    return await this.otpRepository.save(newOTP);
  }

  async validateCust(otpValidation: ValidateOTP) {
    const customer = await this.customerRepository.findOneOrFail({
      where: {
        mobile_no: otpValidation.mobile_no,
      },
    });

    //Un-Comment It Later, For Now Do By ByPass, By Faiz, --At 06/11/2022

    // const OTP = await this.otpRepository.findOneOrFail({
    //   where: {
    //     otp_value: otpValidation.otp_value,
    //     cust_id: customer.cust_id,
    //   },
    // });

    // if (!fromShared.Time.validateOTPExpirationTime(OTP.otp_expiration)) {
    //    await this.customerRepository
    //     .update(customer.cust_id, { is_verified: true })
    //     .catch(e => {
    //       throw fromShared.compose('error in verification');
    //     });

    //     const upatedCustomer = await  this.customerRepository.findOneOrFail({
    //       where: {
    //         mobile_no: otpValidation.mobile_no,
    //       },
    //     });

    //   return classToPlain(upatedCustomer);
    // } 
    // else {
    //    throw 'OTP Expired';
    // }   

    await this.customerRepository
      .update(customer.cust_id, { is_verified: true })
      .catch(e => {
        throw fromShared.compose('error in verification');
      });

    const upatedCustomer = await this.customerRepository.findOneOrFail({
      where: {
        mobile_no: otpValidation.mobile_no,
      },
    });

    return classToPlain(upatedCustomer);
  }

  async validateAdmin(otpValidation: ValidateOTP) {
    const admin = await this.adminRepository.findOneOrFail({
      where: {
        mobile_no: otpValidation.mobile_no,
      },
    });
    const OTP = await this.otpRepository.findOneOrFail({
      where: {
        otp_value: otpValidation.otp_value,
        admin_id: admin.admin_id,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return !fromShared.Time.validateOTPExpirationTime(OTP.otp_expiration);
  }

  async findAll(): Promise<OTP[]> {
    return await this.otpRepository.find();
  }
}
