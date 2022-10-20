import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  TransactionManager,
  EntityManager,
  getManager,
} from 'typeorm';
import { Admin } from './admin.entity';
import {
  ChangePassword,
  ForgotPassword,
  Profile,
  ProfileEdit,
  DeleteCustomer,
  AdminDTO,
  Analytics,
  CustomerRecharge,
} from './admin.dto';
import { HashingService } from '../shared/services/hashing.service';
import * as fromShared from '../shared';
import { Customer } from '../customer/customer.entity';
import { CustomerDTO } from '../customer/customer.dto';
import { classToPlain } from 'class-transformer';
import { OTP } from '../OTP/otp.entity';
import { ConfigService } from '../configuration/configuration.service';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(OTP)
    private readonly otpRepository: Repository<OTP>,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    private readonly passwordManager: HashingService,
  ) {}

  async save(req: AdminDTO) {
    const existingAdmin = await this.adminRepository.find();
    if (!existingAdmin.length) {
      const admin = new Admin();
      admin.first_name = req.first_name;
      admin.last_name = req.last_name;
      admin.password = await this.passwordManager.getHash(req.password);
      admin.mobile_no = req.mobile_no;

      await this.adminRepository.save(admin).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
    }
  }

  // async saveSuperAdmin(req: AdminDTO, manager) {
  //   return await this.newAdmin(req, fromShared.ROLES.SUPER_ADMIN, manager);
  // }

  // async saveAdmin(req: AdminDTO, manager) {
  //   return await this.newAdmin(req, fromShared.ROLES.ADMIN, manager);
  // }

  // async saveAgent(req: AdminDTO, manager) {
  //   return await this.newAdmin(req, fromShared.ROLES.AGENT_ADMIN, manager);
  // }

  // async saveRetailer(req: AdminDTO, manager) {
  //   return await this.newAdmin(req, fromShared.ROLES.RETAILER, manager);
  // }

  // @Transaction()
  // private async newAdmin(
  //   req: AdminDTO,
  //   roleId,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   if (roleId !== fromShared.ROLES.SUPER_ADMIN) {
  //     if (!req.parent_admin_id) {
  //       throw fromShared.compose('Parent admin reference required');
  //     }
  //   }

  //   let admin: Admin;
  //   const pass = this.passwordManager.generateRandom();
  //   const role = await this.roleRepository
  //     .findOneOrFail({
  //       where: {
  //         role_id: roleId,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find role.');
  //     });

  //   if (req.admin_id) {
  //     admin = await this.adminRepository
  //       .findOneOrFail({
  //         where: {
  //           admin_id: req.admin_id,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Cannot find user.');
  //       });
  //     admin.updated_by = req.updated_by;
  //   } else {
  //     const existingAdmin = await this.adminRepository
  //       .findOne({
  //         where: {
  //           mobile_no: req.mobile_no,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Error in finding existing admin');
  //       });

  //     const existingCustomer = await this.customerRepository
  //       .findOne({
  //         where: {
  //           mobile_no: req.mobile_no,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Error in finding existing customer');
  //       });

  //     if (existingAdmin || existingCustomer) {
  //       throw fromShared.compose('Mobile no already registered');
  //     }
  //     admin = new Admin();
  //     admin.mobile_no = req.mobile_no;
  //     admin.points = req.points;
  //     admin.deposit = req.deposit;
  //     admin.password = await this.passwordManager.getHash(
  //       roleId !== fromShared.ROLES.SUPER_ADMIN ? pass : req.password,
  //     );
  //     admin.role = role;
  //     admin.is_first_time =
  //       roleId !== fromShared.ROLES.SUPER_ADMIN ? true : false;
  //   }
  //   admin.first_name = req.first_name.toLowerCase();
  //   admin.last_name = req.last_name.toLowerCase();
  //   admin.created_by = req.created_by;
  //   admin.updated_by = req.updated_by;

  //   if (admin.role_id === fromShared.ROLES.SUPER_ADMIN) {
  //     admin.deposit = 0;
  //     admin.points = 0;
  //   }

  //   if (req.parent_admin_id) {
  //     const parentAdmin = await this.adminRepository
  //       .findOneOrFail({
  //         where: {
  //           admin_id: req.parent_admin_id,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Cannot find Parent admin.');
  //       });

  //     if (
  //       parentAdmin.role_id === fromShared.ROLES.SUPER_ADMIN &&
  //       (req.points || req.deposit)
  //     ) {
  //       throw fromShared.compose('Not Authorized to add points');
  //     }

  //     if (parentAdmin.points < req.points) {
  //       throw fromShared.compose('Insufficient Points');
  //     }
  //     parentAdmin.points = parentAdmin.points - req.points;
  //     await manager.save(parentAdmin).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });
  //     admin.parent = parentAdmin;

  //     const newAdmin = await manager.save(admin).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });

  //     if (!req.admin_id) {
  //       if (admin.points) {
  //         const cTxn = new AdminTransaction();
  //         cTxn.particulars = `You were added by ${parentAdmin.first_name}`;
  //         cTxn.admin_id = newAdmin.admin_id;
  //         cTxn.credit_amount = admin.points;
  //         cTxn.final_amount = admin.points;

  //         const dTxn = new AdminTransaction();
  //         dTxn.particulars = `You added ${admin.first_name} (${role.role_name})`;
  //         dTxn.admin_id = parentAdmin.admin_id;
  //         dTxn.debit_amount = admin.points;
  //         dTxn.final_amount = parentAdmin.points;

  //         await manager.save([cTxn, dTxn]).catch(e => {
  //           throw fromShared.compose(fromShared.operationFailed);
  //         });
  //       }
  //     }
  //     return {
  //       pwd: pass,
  //       mobile_no: newAdmin.mobile_no,
  //     };
  //   } else {
  //     const newAdmin = await manager.save(admin).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });
  //     return {
  //       pwd: pass,
  //       mobile_no: newAdmin.mobile_no,
  //     };
  //   }
  // }

  // async findAll(): Promise<Admin[]> {
  //   return await this.adminRepository.find();
  // }

  // async findAdmins(req) {
  //   const order = req.order ? req.order : null;
  //   const totalData = req.data_per_page
  //     ? req.data_per_page
  //     : fromShared.DEFAULT.PAGINATION;
  //   const fullName = req.full_name
  //     ? [
  //         { first_name: Like(`%${req.full_name.toLowerCase()}%`) },
  //         { last_name: Like(`%${req.full_name.toLowerCase()}%`) },
  //       ]
  //     : [];
  //   if (order) {
  //     Object.keys(order).forEach(e => {
  //       if (!order[e]) {
  //         delete order[e];
  //       }
  //     });
  //   }
  //   const paginationQuery = fullName;
  //   // if (paginationQuery) {
  //   //   Object.keys(paginationQuery).forEach(e => {
  //   //     if (!paginationQuery[e]) {
  //   //       delete paginationQuery[e];
  //   //     }
  //   //   });
  //   // }

  //   const admin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: req.admin_id,
  //       },
  //       relations: ['role', 'children'],
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find user');
  //     });

  //   const childAdminsID = admin.children.map(e => e.admin_id);
  //   if (
  //     admin.role_id === fromShared.ROLES.SUPER_ADMIN ||
  //     admin.role_id === fromShared.ROLES.ADMIN
  //   ) {
  //     if (req.admin_role_id) {
  //       return await this.findByPagination(
  //         req.current_page,
  //         req.role_id,
  //         req.admin_role_id,
  //         order,
  //         paginationQuery,
  //         totalData,
  //       );
  //     } else {
  //       return await this.findByPagination(
  //         req.current_page,
  //         req.role_id,
  //         null,
  //         order,
  //         paginationQuery,
  //         totalData,
  //       );
  //     }
  //   }

  //   if (admin.role_id === req.role_id) {
  //     return await this.findByPagination(
  //       req.current_page,
  //       req.role_id,
  //       req.admin_id,
  //       order,
  //       paginationQuery,
  //       totalData,
  //     );
  //   } else if (req.admin_role_id) {
  //     const containsChild = childAdminsID.find(e => e === req.admin_role_id);
  //     if (containsChild) {
  //       return await this.findByPagination(
  //         req.current_page,
  //         req.role_id,
  //         req.admin_role_id,
  //         order,
  //         paginationQuery,
  //         totalData,
  //       );
  //     } else {
  //       throw fromShared.compose('Not Parent Entity');
  //     }
  //   } else {
  //     return await this.findByPagination(
  //       req.current_page,
  //       req.role_id,
  //       req.admin_id,
  //       order,
  //       paginationQuery,
  //       totalData,
  //     );
  //   }
  // }

  // private async findByPagination(
  //   currentPage,
  //   roleID,
  //   adminID?,
  //   orders?,
  //   query?,
  //   totalCount?,
  // ) {
  //   const adminQuery = adminID
  //     ? {
  //         role_id: roleID,
  //         parent_admin_id: adminID,
  //       }
  //     : {
  //         role_id: roleID,
  //       };

  //   const whereQuery = query.length
  //     ? query.map(e => ({ ...adminQuery, ...e }))
  //     : adminQuery;
  //   const paginationQuery: any = {
  //     where: whereQuery,
  //     relations: ['parent'],
  //   };

  //   if (orders) {
  //     paginationQuery.order = orders;
  //   }

  //   const total = await this.adminRepository.count(paginationQuery);
  //   const tableData = classToPlain(
  //     await this.adminRepository.find(
  //       fromShared.PaginationService.paginate({
  //         totalData: total,
  //         currentPage,
  //         dataPerPage: totalCount,
  //         query: paginationQuery,
  //       }),
  //     ),
  //   );

  //   return { total_data: total, table_data: tableData };
  // }

  async changePassword(pass: ChangePassword) {
    const user = await this.adminRepository
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
      // if (user.is_first_time || user.is_password_changed) {
      //   user.is_first_time = false;
      //   user.is_password_changed = false;
      // }
      user.password = await this.passwordManager.getHash(pass.new_password);
      await this.adminRepository.save(user).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
    } else {
      throw fromShared.compose('Old password not matched');
    }
  }

  async forgotPassword(forgotPass: ForgotPassword) {
    const user = await this.adminRepository
      .findOneOrFail({
        where: { mobile_no: forgotPass.mobile_no },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    const OTP = await this.otpRepository
      .findOneOrFail({
        where: {
          otp_value: forgotPass.otp_value,
          admin_id: user.admin_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find OTP');
      });

    const isAuthenticated = !fromShared.Time.validateOTPExpirationTime(
      OTP.otp_expiration,
    );
    if (isAuthenticated) {
      // if (user.is_first_time) {
      //   user.is_first_time = false;
      // }

      user.password = await this.passwordManager.getHash(forgotPass.password);
      await this.adminRepository.save(user).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
    } else {
      throw fromShared.compose('OTP expired');
    }
  }

  @Transaction()
  async deleteCustomer(
    del: DeleteCustomer,
    @TransactionManager() manager: EntityManager,
  ) {
    const query = {
      cust_id: del.cust_id,
    };

    const customer = await this.customerRepository
      .findOneOrFail({
        where: query,
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    await this.deleteCustomers([customer.cust_id], manager).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async blockCustomer(del: DeleteCustomer) {
    // const admin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: del.admin_id,
    //     },
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('Cannot find user.');
    //   });

    const query = {
      cust_id: del.cust_id,
      // admin_id: admin.admin_id,
    };

    const customer = await this.customerRepository
      .findOneOrFail({
        where: query,
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    await this.customerRepository
      .update(customer.cust_id, { is_blocked: !customer.is_blocked })
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
  }

  // @Transaction()
  // async deleteAdmin(
  //   del: DeleteAdmin,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   const checkAdmin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: del.parent_admin_id,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find user.');
  //     });

  //   if (checkAdmin.role_id !== fromShared.ROLES.ADMIN) {
  //     const parentAdmin = await this.adminRepository
  //       .findOneOrFail({
  //         where: {
  //           admin_id: del.parent_admin_id,
  //           is_blocked: false,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Cannot find user.');
  //       });

  //     const admin = await this.adminRepository
  //       .findOneOrFail({
  //         where: {
  //           admin_id: del.admin_id,
  //           parent_admin_id: parentAdmin.admin_id,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Cannot find user.');
  //       });

  //     if (admin.role_id === fromShared.ROLES.RETAILER) {
  //       await this.deleteRetailers([admin.admin_id], manager);
  //     }

  //     if (admin.role_id === fromShared.ROLES.AGENT_ADMIN) {
  //       await this.deleteAgents([admin.admin_id], manager);
  //     }
  //   } else {
  //     const admin = await this.adminRepository
  //       .findOneOrFail({
  //         where: {
  //           admin_id: del.admin_id,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Cannot find user.');
  //       });

  //     if (admin.role_id === fromShared.ROLES.RETAILER) {
  //       await this.deleteRetailers([admin.admin_id], manager);
  //     }

  //     if (admin.role_id === fromShared.ROLES.AGENT_ADMIN) {
  //       await this.deleteAgents([admin.admin_id], manager);
  //     }
  //   }
  // }

  // async getPoints(points: Points) {
  //   return await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: points.admin_id,
  //       },
  //       select: ['points'],
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find user.');
  //     });
  // }

  // @Transaction()
  // async rechargeWallet(
  //   recharge: Recharge,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   const givingAdmin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: recharge.admin_giving_id,
  //         status: true,
  //         is_blocked: false,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find user.');
  //     });

  //   const takingAdmin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: recharge.admin_taking_id,
  //         status: true,
  //         is_blocked: false,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find user.');
  //     });

  //   if (recharge.points < 0) {
  //     throw fromShared.compose('Recharge should be greater than 0');
  //   }

  //   if (
  //     givingAdmin.role_id === fromShared.ROLES.SUPER_ADMIN ||
  //     takingAdmin.role_id === fromShared.ROLES.SUPER_ADMIN
  //   ) {
  //     throw fromShared.compose('Not authorized to recharge');
  //   }

  //   if (
  //     takingAdmin.admin_id === givingAdmin.admin_id &&
  //     givingAdmin.role_id === fromShared.ROLES.ADMIN
  //   ) {
  //     const vendor = await this.adminRepository
  //       .findOneOrFail({
  //         where: {
  //           admin_id: recharge.admin_taking_id,
  //         },
  //       })
  //       .catch(e => {
  //         throw fromShared.compose('Cannot find user.');
  //       });
  //     vendor.points = vendor.points + recharge.points;

  //     const updatedVendor = await manager.save(vendor).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });
  //     const txn = new AdminTransaction();
  //     txn.particulars = `My Wallet Recharge`;
  //     txn.admin_id = updatedVendor.admin_id;
  //     txn.credit_amount = recharge.points;
  //     txn.final_amount = updatedVendor.points;
  //     await manager.save(txn).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });
  //     return updatedVendor;
  //   } else {
  //     if (givingAdmin.admin_id === takingAdmin.admin_id) {
  //       throw fromShared.compose('You cannot recharge your own wallet');
  //     }

  //     if (givingAdmin.role_id > takingAdmin.role_id) {
  //       throw fromShared.compose('Permission Denied');
  //     }

  //     if (givingAdmin.points < recharge.points) {
  //       throw fromShared.compose('Insufficient Balance');
  //     }

  //     takingAdmin.points = takingAdmin.points + recharge.points;
  //     givingAdmin.points = givingAdmin.points - recharge.points;

  //     const taking = await manager.save(takingAdmin).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });

  //     const giving = await manager.save(givingAdmin).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });

  //     const cTxn = new AdminTransaction();
  //     cTxn.particulars = `Your wallet recharge by ${givingAdmin.first_name}`;
  //     cTxn.admin_id = taking.admin_id;
  //     cTxn.credit_amount = recharge.points;
  //     cTxn.final_amount = taking.points;

  //     const dTxn = new AdminTransaction();
  //     dTxn.particulars = `${taking.first_name}'s wallet recharge by you`;
  //     dTxn.admin_id = giving.admin_id;
  //     dTxn.debit_amount = recharge.points;
  //     dTxn.final_amount = giving.points;
  //     await manager.save([cTxn, dTxn]).catch(e => {
  //       throw fromShared.compose(fromShared.operationFailed);
  //     });

  //     return giving;
  //   }
  // }

  // async updateCustomerStatus(cust: CustomerDTO) {
  //   const customer = await this.customerRepository
  //     .findOneOrFail({
  //       where: {
  //         cust_id: cust.cust_id,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('User not found');
  //     });

  //   customer.status = cust.status;
  //   this.customerRepository.save(customer).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  async updateAdminProfile(req: ProfileEdit) {
    const admin = await this.adminRepository
      .findOneOrFail({
        where: {
          admin_id: req.admin_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });

    admin.first_name = req.first_name;
    admin.last_name = req.last_name;

    this.adminRepository.save(admin).catch(e => {
      fromShared.compose(fromShared.operationFailed);
    });

    return {
      first_name: admin.first_name,
      last_name: admin.last_name,
    };
  }

  // @Transaction()
  // async acceptPayment(
  //   payment: Payment,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   const customer = await this.customerRepository
  //     .findOneOrFail({
  //       where: {
  //         cust_id: payment.cust_id,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cust not found');
  //     });

  //   const admin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: payment.admin_id,
  //         status: true,
  //         is_blocked: false,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('User not found');
  //     });

  //   if (
  //     admin.role_id !== fromShared.ROLES.RETAILER &&
  //     customer.admin_id !== admin.admin_id
  //   ) {
  //     throw fromShared.compose('Unauthorized');
  //   }
  //   if (payment.amount > customer.points) {
  //     throw fromShared.compose('Amount cannot be greater');
  //   }

  //   if (payment.amount <= 0) {
  //     throw fromShared.compose('Amount should be greater than 0');
  //   }

  //   customer.points = customer.points - payment.amount;
  //   const updatedCustomer = await manager.save(customer).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });

  //   const dTxn = new CustomerTransaction();
  //   dTxn.particulars = `Points encashed`;
  //   dTxn.cust_id = updatedCustomer.cust_id;
  //   dTxn.debit_amount = payment.amount;
  //   dTxn.transaction_type = fromShared.TrxnType.WALLET;
  //   dTxn.final_amount = updatedCustomer.points;

  //   await manager.save(dTxn).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  async profile(req: Profile) {
    return classToPlain(
      await this.adminRepository
        .findOneOrFail({
          where: {
            admin_id: req.admin_id,
          },
        })
        .catch(e => {
          throw fromShared.compose('User not found');
        }),
    );
  }

  async getAnalysis(req: Analytics) {
    const manager = getManager();
    const totalPlayed = await manager.query(
      `SELECT SUM(total_amount) from bet_history where cust_id = ${req.cust_id} AND extract(month from game_date) = extract(month from CURRENT_DATE);`,
    );

    const totalWon = await manager.query(
      `SELECT SUM(winning_amount) from bet_history where cust_id = ${req.cust_id} AND extract(month from game_date) = extract(month from CURRENT_DATE);`,
    );

    const merged = {
      total_played: totalPlayed && totalPlayed[0].sum ? +totalPlayed[0].sum : 0,
      total_won: totalWon && totalWon[0].sum ? +totalWon[0].sum : 0,
      total_loss:
        totalPlayed && totalWon && totalPlayed[0].sum && totalWon[0].sum
          ? +totalPlayed - +totalWon
          : 0,
    };

    return merged;
  }

  convertToMonth(month) {
    switch (month) {
      case '01':
        return 'January';
      case '02':
        return 'February';
      case '03':
        return 'March';
      case '04':
        return 'April';
      case '05':
        return 'May';
      case '06':
        return 'June';
      case '07':
        return 'July';
      case '08':
        return 'August';
      case '09':
        return 'September';
      case '10':
        return 'October';
      case '11':
        return 'November';
      case '12':
        return 'December';
    }
  }

  @Transaction()
  async rechargeCustomerWallet(
    recharge: CustomerRecharge,
    @TransactionManager() manager: EntityManager,
  ) {
    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: recharge.cust_id,
          status: true,
          is_blocked: false,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user.');
      });

    if (recharge.points <= 0) {
      throw fromShared.compose('Amount should bre greater than 0');
    }

    customer.points = customer.points + recharge.points;
    customer.bonus = recharge.points;

    const customerUpdated = await manager.save(customer).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    const trxnMessage = 'bonus';
    const cTxn = new CustomerTransaction();
    cTxn.particulars = `Your ${trxnMessage} recharge by Pinnacle Matka`;
    cTxn.cust_id = customerUpdated.cust_id;
    cTxn.credit_amount = recharge.points;
    cTxn.final_amount = customerUpdated.points;
    cTxn.transaction_type = fromShared.TrxnType.WALLET;

    await manager.save(cTxn).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  // async resetAdminPwd(req: ResetPassAdmin) {
  //   await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: req.parent_admin_id,
  //         status: true,
  //         is_blocked: false,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find admin');
  //     });

  //   const admin = await this.adminRepository.findOneOrFail({
  //     where: {
  //       admin_id: req.admin_id,
  //     },
  //   });

  //   const password = this.passwordManager.generateRandom();
  //   admin.password = await this.passwordManager.getHash(password);
  //   admin.is_password_changed = true;

  //   await this.adminRepository.save(admin).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });

  //   return {
  //     unique_key: password,
  //   };
  // }

  // async resetCustPwd(req: ResetPassCust) {
  //   await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: req.admin_id,
  //         status: true,
  //         is_blocked: false,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find admin');
  //     });

  //   const cust = await this.customerRepository
  //     .findOneOrFail({
  //       where: {
  //         cust_id: req.cust_id,
  //         admin_id: req.admin_id,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find user');
  //     });

  //   const password = this.passwordManager.generateRandom();
  //   cust.password = await this.passwordManager.getHash(password);
  //   cust.is_password_changed = true;

  //   await this.customerRepository.save(cust).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });

  //   return {
  //     unique_key: password,
  //   };
  // }

  private async deleteCustomers(
    customers: Array<number>,
    manager: EntityManager,
  ) {
    await manager.delete(Customer, customers);
  }

  // private async deleteRetailers(
  //   retailers: Array<number>,
  //   manager: EntityManager,
  // ) {
  //   let customers = await this.customerRepository
  //     .find({
  //       where: {
  //         admin_id: In(retailers),
  //       },
  //       select: ['cust_id'],
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find customers.');
  //     });

  //   if (customers.length) {
  //     let customersId = customers.map(e => e.cust_id);
  //     await this.deleteCustomers(customersId, manager);
  //   }
  //   await manager.delete(Admin, retailers).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  // private async deleteAgents(agents: Array<number>, manager: EntityManager) {
  //   let retailers = await this.adminRepository
  //     .find({
  //       where: {
  //         parent_admin_id: In(agents),
  //       },
  //       select: ['admin_id'],
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Cannot find Admins.');
  //     });
  //   if (retailers.length) {
  //     let retailersId = retailers.map(e => e.admin_id);
  //     await this.deleteRetailers(retailersId, manager);
  //   }
  //   await manager.delete(Admin, agents).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  async deleteData() {
    const manager = getManager();
    const bazaarHistory = await manager
      .query(
        `DELETE FROM bazaar_result_history WHERE created_at NOT BETWEEN  (NOW() - INTERVAL '3 months') AND  NOW();`,
      )
      .catch(e => {
        throw fromShared.compose('cannot delete data');
      });
  }
}
