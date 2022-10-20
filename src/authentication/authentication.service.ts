import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Customer } from './../customer/customer.entity';
import { CustAuth, AdminAuth, LogOut } from './authentication.dto';
import { classToPlain } from 'class-transformer';
import { Admin } from '../admin/admin.entity';
import * as fromShared from '../shared';
import { ConfigService } from '../configuration/configuration.service';
import { CustomerDTO } from '../customer/customer.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    private readonly passwordManager: fromShared.HashingService,
    @Optional() private readonly jwtService: JwtService,
    @Optional() private readonly securityService: fromShared.RSA,
  ) {}

  private async authorize(req, user) {
    if (!user) {
      throw fromShared.compose('Invalid Credentials.');
    }
    const isAuthenticated = await this.passwordManager
      .compareHash(req.auth_user_password, user.password)
      .catch(e => {
        throw fromShared.compose('Invalid Credentials');
      });

    // const storeRetailers = await this.configService
    // .findByKey('play_store_admins')
    // .catch(e => {
    //   throw fromShared.compose('Error in finding configuration');
    // });

    // if(storeRetailers && storeRetailers.config_value){
    // const isplayStore = fromShared.isStoreRetailer(user.admin_id, storeRetailers.config_value);
    // user.is_playstore = isplayStore;
    // } else {
    //   user.is_playstore = null;
    // }

    if (isAuthenticated) {
      // if (user.role_id) {
      //   role = {
      //     role: user.role_id,
      //   };
      // }

      const customclaims = req.device_id
        ? {
            sub: user.cust_id || user.admin_id,
            mobile_no: user.mobile_no,
            device_id: req.device_id,
          }
        : {
            sub: user.cust_id || user.admin_id,
            mobile_no: user.mobile_no,
          };
      const token = this.jwtService.sign({ ...customclaims });
      const returnObj = {
        user_token: token,
      };
      if (user.cust_id) {
        user.device_id = req.device_id;
        await this.customerRepository.save(user);
      }
      return { ...classToPlain(user), ...returnObj };
    } else {
      throw fromShared.compose('Invalid Credentials.');
    }
  }

  async newCustomer(req: CustomerDTO) {
    const findExisting = await this.customerRepository
      .findOne({
        where: {
          mobile_no: req.mobile_no,
        },
      })
      .catch(e => {
        throw fromShared.compose('Error in finding Customer');
      });

    if (findExisting) {
      throw fromShared.compose('Number already registered');
    }

    const findExistingEmail = await this.customerRepository
      .findOne({
        where: {
          email: req.email,
        },
      })
      .catch(e => {
        throw fromShared.compose('Error in finding Customer');
      });

    if (findExistingEmail) {
      throw fromShared.compose('Email already registered');
    }
    const newcust = new Customer();
    newcust.first_name = req.first_name.toLowerCase();
    newcust.last_name = req.last_name.toLowerCase();
    newcust.password = await this.passwordManager.getHash(req.password);
    newcust.mobile_no = req.mobile_no;
    newcust.dob = req.dob;
    newcust.points = 0;
    newcust.country_code = req.country_code;
    if(req.email){
      newcust.email = req.email;
    }

    const cust = await this.customerRepository.save(newcust).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    const token = await this.login({
      auth_user_id: cust.mobile_no,
      auth_user_password: req.password,
      device_id: req.device_id,
    });

    return {
      user_token: token.user_token,
      mobile_no: req.mobile_no,
      cust_id: cust.cust_id,
      is_verified: cust.is_verified,
    };
  }

  async login(req: CustAuth) {
    const user = await this.customerRepository
      .findOneOrFail({
        where: {
          mobile_no: req.auth_user_id,
          status: true,
          is_blocked: false,
        },
      })
      .catch(e => {
        throw fromShared.compose('Invalid Credentials');
      });

    // if(!user.is_verified) {
    //   throw fromShared.compose('Not Verified');
    // }

    // if(user.device_id && user.device_id !== req.device_id){
    //   throw fromShared.compose('Signed in other device');
    // }

    return await this.authorize(req, user);
  }

  async adminLogin(req: AdminAuth) {
    const user = await this.adminRepository
      .findOne({
        where: {
          mobile_no: req.auth_user_id,
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Invalid Credentials');
      });

    return await this.authorize(req, user);
  }

  async getPublicKey() {
    const pubk = await this.securityService.getPublicKey();
    const prik = await this.securityService.getPrivateKey();
    return {
      key: pubk,
      iv: prik,
    };
  }

  async checkCustomer(req) {
    return await this.customerRepository
      .findOne({
        where: {
          mobile_no: req.mobile_no,
          status: true,
          is_blocked: false,
        },
      })
      .catch(e => {
        throw fromShared.compose('User doesnt exist');
      });
  }

  async checkAdmin(req) {
    return await this.adminRepository
      .findOne({
        where: {
          mobile_no: req.mobile_no,
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('User doesnt exist');
      });
  }

  async customerLogout(req: LogOut) {
    const cust = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: req.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });

    cust.device_id = null;
    await this.customerRepository.save(cust);
  }

  async adminLogout(req) {
    req.session.cookie.expires = new Date(Date.now());
    await req.logout();
  }
}
