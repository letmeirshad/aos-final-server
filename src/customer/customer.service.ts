import { Injectable, Inject, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  TransactionManager,
  EntityManager,
  In,
  Like,
} from 'typeorm';
import { Customer } from './customer.entity';
import {
  ChangePassword,
  CustomerDTO,
  CustomerUpdateDTO,
  ProfileImage,
  ForgotPassword,
  Profile,
  VerifyDTO,
  KYCDTO,
  ForgotPasswordRequest,
} from './customer.dto';
import { DbVersion } from '../db-version/db-version.entity';
import { classToPlain } from 'class-transformer';
import * as fromShared from './../shared';
import { Admin } from '../admin/admin.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { OTP } from '../OTP/otp.entity';
import { ConfigService } from '../configuration/configuration.service';

import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { BetHistory } from '../bet-history/bet-history.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { OTPService } from '../OTP/otp.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(DbVersion)
    private readonly dbversionRepository: Repository<DbVersion>,
    @Inject(BazaarService)
    private readonly bazaarService: BazaarService,
    @InjectRepository(BazaarDate)
    private readonly bazaarDateRespository: Repository<BazaarDate>,
    @InjectRepository(BetHistory)
    private readonly betHistoryRespository: Repository<BetHistory>,

    @InjectRepository(OTP)
    private readonly otpRepository: Repository<OTP>,
    @InjectRepository(CustomGame)
    private readonly customGameRepository: Repository<CustomGame>,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    private readonly passwordManager: fromShared.HashingService,
    private readonly imageManager: fromShared.ImageService,
    private readonly otpService: OTPService,
  ) {}

  async update(req: CustomerUpdateDTO) {
    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: req.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user');
      });

    if (customer) {
      customer.first_name = req.first_name.toLowerCase();
      customer.last_name = req.last_name.toLowerCase();
      customer.email = req.email;
    }

    await this.customerRepository.save(customer).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async findByPagination(req, playStore?) {
    const order = req.order ? req.order : null;
    const fullName = req.full_name
      ? [
          { first_name: Like(`%${req.full_name.toLowerCase()}%`) },
          { last_name: Like(`%${req.full_name.toLowerCase()}%`) },
        ]
      : [];
    if (order) {
      Object.keys(order).forEach(e => {
        if (!order[e]) {
          delete order[e];
        }
      });
    }
    // const admin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: req.admin_id,
    //     },
    //     relations: ['children'],
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('User not found');
    //   });

    // const childAdminsID = admin.children.map(e => e.admin_id);

    let query;
    let paginationQuery;
    paginationQuery = {
      where: fullName.length ? fullName : {},
    };

    if (order) {
      paginationQuery.order = order;
    }

    const total = await this.customerRepository.count(paginationQuery);
    const tableData = await this.customerRepository.find(
      fromShared.PaginationService.paginate({
        totalData: total,
        currentPage: req.current_page,
        query: paginationQuery,
      }),
    );

    const filtered = tableData.map(async e => {
      const allBet = await this.betHistoryRespository.find({
        where: {
          cust_id: e.cust_id,
        },
      });

      const previousMonth = allBet.filter(e =>
        fromShared.Time.isPreviousMonth(e.created_at),
      );

      if (previousMonth.length) {
        const wonAmountList = previousMonth
          .filter(e => e.is_winner === true)
          .map(e => e.winning_amount);

        const wonAmount = wonAmountList.length
          ? wonAmountList.reduce((a, b) => a + b)
          : 0;

        const lastMonthPlayed = previousMonth
          .map(e => e.total_amount)
          .reduce((a, b) => a + b);
        e.last_month_won = wonAmount;
        e.last_month_played = lastMonthPlayed;
      }

      return e;
    });

    const filteredResult = await Promise.all(filtered);

    return { total_data: total, table_data: classToPlain(filteredResult) };
  }

  async profile(req: Profile) {
    return await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: req.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });
  }

  async changePassword(pass: ChangePassword) {
    const user = await this.customerRepository
      .findOneOrFail({
        where: { mobile_no: pass.mobile_no },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    const isAuthenticated = await this.passwordManager
      .compareHash(pass.old_password, user.password)
      .catch(e => {
        throw fromShared.compose('Old password not matched');
      });

    if (isAuthenticated) {
      if (user.is_first_time) {
        user.is_first_time = false;
      }
      user.is_password_changed = false;
      user.password = await this.passwordManager.getHash(pass.new_password);
      await this.customerRepository.save(user).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
    } else {
      throw fromShared.compose('Old password not matched');
    }
  }

  async forgotPasswordRequest(forgotPasswordRequest: ForgotPasswordRequest) {
    const user = await this.customerRepository
      .findOneOrFail({
        where: {
          mobile_no: forgotPasswordRequest.mobile_no,
          is_blocked: false,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    await this.otpService.createCust({ mobile_no: user.mobile_no }).catch(e => {
      throw fromShared.compose('Cannot send OTP');
    });
  }

  async forgotPassword(forgotPass: ForgotPassword) {
    const user = await this.customerRepository
      .findOneOrFail({
        where: { mobile_no: forgotPass.mobile_no, is_blocked: false },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    const OTP = await this.otpRepository
      .findOneOrFail({
        where: {
          otp_value: forgotPass.otp_value,
          cust_id: user.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find OTP');
      });

    const isAuthenticated = !fromShared.Time.validateOTPExpirationTime(
      OTP.otp_expiration,
    );

    if (isAuthenticated) {
      if (user.is_first_time) {
        user.is_first_time = false;
      }
      user.password = await this.passwordManager.getHash(forgotPass.password);
      await this.customerRepository.save(user).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
    } else {
      throw fromShared.compose('OTP expired');
    }
  }

  async getPoints(id) {
    return await this.customerRepository.findOneOrFail({
      where: {
        cust_id: id,
      },
      select: ['points'],
    });
  }

  async verify(req: VerifyDTO) {
    const cust = await this.customerRepository
      .findOneOrFail({
        where: {
          mobile_no: req.mobile_no,
        },
      })
      .catch(e => {
        throw fromShared.compose('Invalid Credentials');
      });

    return {
      cust_id: cust.cust_id,
    };
  }

  async getInitialSetup(id) {
    const response: any = {};

    let customer = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: id,
        },
      })
      .catch(e => {
        throw { udm_message: 'Cannot find user' };
      });

    let customGames = await this.customGameRepository
      .find({
        where: {
          status: true,
        },
        relations: ['amounts'],
      })
      .catch(e => {
        fromShared.compose('cannot find custom games data');
      });

    let bazaarDate = await this.bazaarDateRespository
      .findOneOrFail({
        where: {
          bazaar_date: fromShared.Dates.getISTDate(),
        },
      })
      .catch(e => {
        throw { udm_message: 'Cannot find date' };
      });

    let bazaars = await this.bazaarService.findAll().catch(e => {
      throw { udm_message: 'Error in finding Bazaar Details' };
    });

    let db_ver = await this.dbversionRepository.findOne({
      order: {
        created_at: 'DESC',
      },
    });

    const appVer = await this.configService.findByKey('apk_version');
    const minRecharge = await this.configService.findByKey(
      'min_recharge_amount',
    );
    const maxRecharge = await this.configService.findByKey(
      'max_recharge_amount',
    );

    //Un-Comment It Later, For Now Do By ByPass, By Faiz, --At 06/11/2022

    // const isInApproval = await this.configService.findByKey(
    //   'is_in_google_approval',
    // );
    // let setInApproval = false;
    // if (isInApproval) {
    //   if (parseInt(isInApproval.config_value) > 0) {
    //     setInApproval = true;
    //   } else {
    //     setInApproval = false;
    //   }
    // }

    let setInApproval = false;

    await this.customerRepository
      .update(customer.cust_id, { bonus: 0 })
      .catch(e => {
        throw { udm_message: 'Error in updating customer' };
      });

    response.customer_data = classToPlain(customer);
    response.bazaar_details = classToPlain(bazaars);
    response.version = classToPlain(db_ver);
    response.app_version = appVer.config_value;
    response.notes = bazaarDate.message;
    response.custom_games = customGames;
    response.min_recharge = minRecharge.config_value;
    response.max_recharge = maxRecharge.config_value;
    response.in_approval = setInApproval;
    return response;
  }

  async updateImage(updateImg: ProfileImage) {
    const customer = await this.customerRepository.findOneOrFail({
      where: {
        cust_id: updateImg.cust_id,
      },
    });

    const filePath = await this.imageManager.addImage(
      updateImg.profile_image,
      `cust${updateImg.cust_id}`,
    );
    customer.profile_image = filePath;
    await this.customerRepository.save(customer);
    return {
      profile_image: `uploads\/${filePath}`,
    };
  }

  async updateKYC(req: KYCDTO) {
    const customer = await this.customerRepository
      .findOne({
        where: {
          cust_id: req.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find customer');
      });

    const updatedCustomer = await this.customerRepository
      .update(customer.cust_id, req)
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    return classToPlain(
      await this.customerRepository.findOne({
        where: {
          cust_id: req.cust_id,
        },
      }),
    );
  }
}
