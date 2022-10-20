import { Injectable, Inject, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from '../admin/admin.entity';
import { Customer } from '../customer/customer.entity';
import {
  Not,
  Connection,
  Like,
  LessThanOrEqual,
  In,
  getManager,
} from 'typeorm';
import {
  EntityManager,
  Repository,
  Transaction,
  TransactionManager,
} from 'typeorm';
import {
  NewAdminPaymentDTO,
  NewCustPaymentDTO,
  CustomerPaymentPagination,
  Pagination,
  UpdateStatus,
  AllDataPagination,
  PaymentAnalysis,
} from './payment.dto';
import { Payment } from './payment.entity';
import * as fromShared from '../shared';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { ConfigService } from '../configuration/configuration.service';
import { CronJob } from 'cron';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { TokenManagerService } from '../token-manager/token-manager.service';
import { classToPlain } from 'class-transformer';

export enum PaymentEntity {
  CUSTOMER = 'C',
  ADMIN = 'A',
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  INITITALIZED = 'INITIALIZED',
  INPROGRESS = 'INPROGRESS',
  FAILED_WITH_ERROR = 'FAILED_WITH_ERROR',
}

@Injectable()
export class PaymentService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(TokenManagerService)
    private readonly tokenService: TokenManagerService,
    private readonly externalService: fromShared.ExternalService,
    private schedulerRegistry: SchedulerRegistry,
    private connection: Connection,
  ) {}

  async onApplicationBootstrap() {
    // await this.verifyPaymentService();
    await this.setCron();
  }

  async setCron() {
    const job = new CronJob(CronExpression.EVERY_MINUTE, async () => {
      await this.verifyPaymentService();
    });
    this.schedulerRegistry.addCronJob('payment-verification-cron', job);
    job.start();
  }

  async verifyPaymentService() {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const statusToTrack = [
        PaymentStatus.INITITALIZED,
        PaymentStatus.INPROGRESS,
      ];
      const pendingVerificationData = await this.paymentRepository.find({
        where: {
          status: In(statusToTrack),
        },
      });

      if (pendingVerificationData.length) {
        const storedToken = await this.tokenService.getToken();
        const processData = async currentToken => {
          const verificationRequestList = pendingVerificationData.map(
            async pendingData => {
              const paymentStatus = await this.externalService.paymentStatus(
                currentToken,
                pendingData.bill_id,
              );

              return paymentStatus;
            },
          );
          const verificationStatusList = await Promise.allSettled(
            verificationRequestList,
          );
          const updateData = verificationStatusList.map(async (res, index) => {
            if (res.status == 'fulfilled' && res.value.data[0].STATUS) {
              const status = res.value.data[0].STATUS;

              if (status === 'SUCCESS') {
                pendingVerificationData[index].status = PaymentStatus.SUCCESS;

                const customer = await this.customerRepository
                  .findOne({
                    where: {
                      cust_id: pendingVerificationData[index].cust_id,
                      status: true,
                      is_blocked: false,
                      is_verified: true,
                    },
                  })
                  .catch(e => {
                    throw fromShared.compose('Customer not found');
                  });

                const cTxn = new CustomerTransaction();
                cTxn.particulars = `You recharged your wallet with ${pendingVerificationData[index].amount}`;
                cTxn.cust_id = customer.cust_id;
                cTxn.credit_amount = pendingVerificationData[index].amount;
                cTxn.final_amount =
                  customer.points + pendingVerificationData[index].amount;
                cTxn.transaction_type = fromShared.TrxnType.WALLET;
                cTxn.recharge_trxn_id = pendingVerificationData[index].bill_id;
                await queryRunner.manager.save(cTxn);
                await queryRunner.manager.update(
                  Customer,
                  pendingVerificationData[index].cust_id,
                  {
                    points:
                      customer.points + pendingVerificationData[index].amount,
                  },
                );

                await queryRunner.manager.save(pendingVerificationData[index]);
              } else if (status == 'FAILED') {
                pendingVerificationData[index].status = PaymentStatus.FAILED;
                await queryRunner.manager.save(pendingVerificationData[index]);
              } else {
                const existingRetryCount = pendingVerificationData[index].retry;
                pendingVerificationData[index].retry = existingRetryCount + 1;
                if (existingRetryCount + 1 >= 3) {
                  pendingVerificationData[index].status =
                    PaymentStatus.FAILED_WITH_ERROR;
                }
                await queryRunner.manager.save(pendingVerificationData[index]);
              }
            }
          });
          await Promise.all(updateData);
        };
        const verificationReq = await this.externalService.paymentStatus(
          storedToken,
          pendingVerificationData[0].bill_id,
        );

        if (
          verificationReq.data[0].ERROR ||
          verificationReq.data.includes('ERROR')
        ) {
          await this.tokenService.updateToken().catch(e => {
            throw fromShared.compose('Error In Payment Authorization');
          });

          const updateRetry = pendingVerificationData.map(async pendingData => {
            const updateQuery =
              pendingData.retry >= 3
                ? {
                    retry: pendingData.retry + 1,
                    status: PaymentStatus.FAILED_WITH_ERROR,
                  }
                : {
                    retry: pendingData.retry + 1,
                  };
            await queryRunner.manager.update(
              Payment,
              pendingData.payment_id,
              updateQuery,
            );
          });

          await Promise.allSettled(updateRetry);
        } else if (verificationReq.data[0].STATUS) {
          await processData(storedToken);
        }
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async newCustomerPayment(req: NewCustPaymentDTO) {
    const customer = await this.customerRepository
      .findOne({
        where: {
          cust_id: req.cust_id,
          is_verified: true,
          is_blocked: false,
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Customer not found');
      });

    const amountToRecharge = req.amount;

    const maxRechargeAmount = await this.configService
      .findByKey('max_recharge_amount')
      .catch(e => {
        throw fromShared.compose('Conf Not Found');
      });

    const minRechargeAmount = await this.configService
      .findByKey('min_recharge_amount')
      .catch(e => {
        throw fromShared.compose('Conf Not Found');
      });

    if (
      amountToRecharge < +minRechargeAmount.config_value ||
      amountToRecharge > +maxRechargeAmount.config_value
    ) {
      throw fromShared.compose(
        `Minimum amount is ${+minRechargeAmount.config_value} and max amount is ${+maxRechargeAmount.config_value}`,
      );
    }

    let token;
    let bill;
    const generateToken = async update => {
      token =
        (await this.tokenService.getToken()) ||
        (await this.tokenService.updateToken().catch(e => {
          throw fromShared.compose('Error In Payment Authorization');
        }));
      if (update) {
        token = await this.tokenService.updateToken().catch(e => {
          throw fromShared.compose('Error In Payment Authorization');
        });
      }
      bill = await this.externalService
        .generateBill(
          token,
          req.amount,
          customer.mobile_no,
          customer.first_name + customer.last_name,
          customer.cust_id,
        )
        .catch(e => {
          console.log(e);
          throw fromShared.compose('Error in generating Bill');
        });

      if (bill === 'ERROR') {
        await generateToken(true);
      }
    };

    await generateToken(false);

    if (!bill) {
      throw fromShared.compose('Error In Bill Generation');
    }

    const admin = await this.adminRepository.find();

    const payment = new Payment();
    payment.cust_id = customer.cust_id;
    payment.admin_id = admin[0].admin_id;
    payment.amount = req.amount;
    payment.requested_by = PaymentEntity.CUSTOMER;
    payment.bill_id = bill;

    await this.paymentRepository.save(payment).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    return bill;
  }

  @Transaction()
  async updateStatus(
    req: UpdateStatus,
    @TransactionManager() manager: EntityManager,
  ) {
    const paymentDetail = await this.paymentRepository
      .findOne({
        where: {
          bill_id: req.bill_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Bill not found');
      });

    const paymentStatus = PaymentStatus.INPROGRESS;

    if (paymentDetail.status === paymentStatus) {
      throw fromShared.compose('Already Updated');
    }

    if (paymentDetail.status === PaymentStatus.INITITALIZED) {
      await manager
        .update(Payment, paymentDetail.payment_id, { status: paymentStatus })
        .catch(e => {
          throw fromShared.compose("Can't update payment status");
        });
    } else {
      throw fromShared.compose("Can't Modify the status");
    }
  }

  // async newAdminChat(req: NewAdminChatDTO) {
  //   const customer = await this.customerRepository
  //     .findOne({
  //       where: {
  //         cust_id: req.cust_id,
  //         is_verified: true,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Customer not found');
  //     });

  //   const admin = await this.adminRepository.find();

  //   const chat = new Chat();
  //   chat.cust_id = customer.cust_id;
  //   chat.admin_id = admin[0].admin_id;
  //   chat.message = req.message;
  //   chat.sent_by = ChatEntity.ADMIN;

  //   await this.chatRepository.save(chat).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  async getCustomerTransaction(req: CustomerPaymentPagination) {
    const payment = this.paymentRepository;
    const query = {
      where: {
        cust_id: req.cust_id,
      },
    };
    const totalCount = await payment.count(query);
    const paginated = classToPlain(
      await payment.find(
        fromShared.PaginationService.paginate({
          totalData: totalCount,
          currentPage: req.current_page,
          query: {
            ...query,
            ...{
              order: {
                created_at: 'DESC',
              },
            },
          },
        }),
      ),
    );

    return {
      total_data: totalCount,
      table_data: paginated,
    };
  }

  async allTransactions(req: AllDataPagination) {
    let total = await this.paymentRepository.count();
    const paginationResolver = fromShared.PaginationService.paginateQueryBuilder(
      { totalData: total, currentPage: req.current_page },
    );
    let inititatedList = this.connection
      .getRepository(Payment)
      .createQueryBuilder('payment')
      .innerJoinAndSelect(Customer, 'cust', 'cust.cust_id = payment.cust_id');

    if (req.payment_cust_id) {
      inititatedList = inititatedList.where('cust.cust_id = :id', {
        id: +req.payment_cust_id,
      });
      total = await inititatedList.getCount();
    }

    if (req.full_name) {
      inititatedList = inititatedList
        .where('cust.first_name like :name', {
          name: `%${req.full_name.toLowerCase()}%`,
        })
        .orWhere('cust.last_name like :name', {
          name: `%${req.full_name.toLowerCase()}%`,
        });

      total = await inititatedList.getCount();
    }

    if (req.payment_bill_id) {
      inititatedList = inititatedList.where('payment.bill_id like :id', {
        id: `%${req.payment_bill_id.toLowerCase()}%`,
      });
      total = await inititatedList.getCount();
    }

    const finalData: any = classToPlain(
      await inititatedList
        .orderBy('payment.created_at', 'DESC')
        .offset(paginationResolver.skip)
        .limit(paginationResolver.take)
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        }),
    );

    const modifiedData = finalData.map(data => {
      data.full_name = `${data.cust_first_name} ${data.cust_last_name}`;
      data.payment_created_at = fromShared.Time.formatDateString(
        data.payment_created_at,
      );
      return data;
    });

    return {
      total_data: total,
      table_data: modifiedData,
    };
  }

  // async markRead(req: ReadStatus) {
  //   const unreadMessages = await this.chatRepository.find({
  //     where: {
  //       cust_id: req.cust_id,
  //       sent_by: ChatEntity.CUSTOMER,
  //       is_read: false,
  //     },
  //   });

  //   const chatIds = unreadMessages.map(chat => chat.chat_id);

  //   await this.chatRepository.update(chatIds, { is_read: true }).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  // async getChat(req: CustomerChatPagination) {
  //   const chats = this.chatRepository;
  //   const query = {
  //     where: {
  //       cust_id: req.cust_id,
  //     },
  //   };
  //   const totalCount = await chats.count(query);
  //   const paginated = await this.chatRepository.find(
  //     fromShared.PaginationService.paginate({
  //       totalData: totalCount,
  //       currentPage: req.current_page,
  //       query: query,
  //     }),
  //   );
  //   return paginated;
  // }

  async getTransactionStatus(req: UpdateStatus) {
    let errorCounter = 0;

    const processData = async () => {
      const storedToken = await this.tokenService.getToken();

      const verificationReq = await this.externalService.paymentStatus(
        storedToken,
        req.bill_id,
      );

      console.log(verificationReq);

      if (
        verificationReq.data[0].ERROR ||
        verificationReq.data.includes('ERROR')
      ) {
        await this.tokenService.updateToken().catch(e => {
          throw fromShared.compose('Error In Payment Authorization');
        });
        errorCounter = errorCounter + 1;
        if (errorCounter < 2) {
          processData();
        } else {
          throw fromShared.compose('Error in token genration service');
        }
      } else {
        return verificationReq.data[0].STATUS;
      }
    };

    const response = await processData().catch(e => {
      throw e;
    });

    const pendingVerificationData = await this.paymentRepository
      .findOneOrFail({
        where: {
          bill_id: req.bill_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('cannot find Bill');
      });

    return {
      previous_status: pendingVerificationData.status,
      current_status:
        response === 'INITIATED' ? PaymentStatus.INPROGRESS : response,
    };
  }

  async updateStatusAdmin(req: UpdateStatus) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const currentStatus = await this.getTransactionStatus(req).catch(e => {
        throw e;
      });

      const pendingVerificationData = await this.paymentRepository
        .findOneOrFail({
          where: {
            bill_id: req.bill_id,
          },
        })
        .catch(e => {
          throw fromShared.compose('cannot find Bill');
        });
      if (
        currentStatus.current_status === 'SUCCESS' &&
        pendingVerificationData.status != PaymentStatus.SUCCESS
      ) {
        pendingVerificationData.status = PaymentStatus.SUCCESS;
        const customer = await this.customerRepository
          .findOne({
            where: {
              cust_id: pendingVerificationData.cust_id,
              status: true,
              is_blocked: false,
              is_verified: true,
            },
          })
          .catch(e => {
            throw fromShared.compose('Customer not found');
          });

        const cTxn = new CustomerTransaction();
        cTxn.particulars = `You recharged your wallet with ${pendingVerificationData.amount}`;
        cTxn.cust_id = customer.cust_id;
        cTxn.credit_amount = pendingVerificationData.amount;
        cTxn.final_amount = customer.points + pendingVerificationData.amount;
        cTxn.transaction_type = fromShared.TrxnType.WALLET;
        cTxn.recharge_trxn_id = pendingVerificationData.bill_id;
        await queryRunner.manager.save(cTxn);
        await queryRunner.manager.update(
          Customer,
          pendingVerificationData.cust_id,
          {
            points: customer.points + pendingVerificationData.amount,
          },
        );

        await queryRunner.manager.save(pendingVerificationData);
      }

      if (
        currentStatus.current_status == 'FAILED' &&
        pendingVerificationData.status != PaymentStatus.FAILED
      ) {
        pendingVerificationData.status = PaymentStatus.FAILED;
        await queryRunner.manager.save(pendingVerificationData);
      }

      if (
        currentStatus.current_status == 'INPROGRESS' &&
        pendingVerificationData.status != PaymentStatus.INPROGRESS
      ) {
        pendingVerificationData.status = PaymentStatus.INPROGRESS;
        await queryRunner.manager.save(pendingVerificationData);
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw fromShared.compose(fromShared.operationFailed);
    } finally {
      await queryRunner.release();
    }
  }

  async analysis(req: PaymentAnalysis) {
    const manager = getManager();
    const totalRecharge = await manager.query(
      `SELECT SUM(amount) FROM payment WHERE status='SUCCESS' AND DATE(created_at)='${req.date}'`,
    );

    const totalWithDrawal = await manager.query(
      `SELECT SUM(initiated_amount) FROM customer_payment WHERE status='SUCCESS' AND DATE(created_at)='${req.date}'`,
    );

    return {
      total_recharge: totalRecharge,
      total_withdrawal: totalWithDrawal,
    };
  }
}
