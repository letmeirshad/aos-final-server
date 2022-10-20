import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  Like,
  Repository,
  Transaction,
  TransactionManager,
} from 'typeorm';
import { CustomerPayment } from './customer-payment.entity';
import {
  CustomerPaymentDTO,
  CancelPaymentDTO,
  CustomerPaymentPagination,
  AllDataPagination,
  TransactionReportDTO,
} from './customer-payment.dto';
import { Customer } from '../customer/customer.entity';
import * as fromShared from '../shared';
import { CronJob } from 'cron';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import excel = require('excel4node');
import { classToPlain } from 'class-transformer';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { createTransport } from 'nodemailer';
import { Payment } from '../payment/payment.entity';

export enum CustPaymentStatus {
  SUCCESS = 'SUCCESS',
  CANCELLED = 'CANCELLED',
  INITIATED = 'INITIATED',
}
@Injectable()
export class CustPaymentService {
  constructor(
    @InjectRepository(CustomerPayment)
    private readonly paymentRepository: Repository<CustomerPayment>,
    @InjectRepository(Customer)
    private readonly custRepository: Repository<Customer>,
    @InjectRepository(Payment)
    private readonly withdrawalRepository: Repository<Payment>,
    private schedulerRegistry: SchedulerRegistry,
    private emailService: fromShared.EmailService,
  ) {}

  // async onApplicationBootstrap() {
  //   await this.setCron();
  // }

  // async setCron() {
  //   const job1 = new CronJob(
  //     '59 23 * * *',
  //     async () => {
  //       await this.sendReport();
  //     },
  //     null,
  //     false,
  //     'Asia/Calcutta',
  //   );
  //   this.schedulerRegistry.addCronJob('report-1', job1);

  //   // const job2 = new CronJob(
  //   //   CronExpression.EVERY_DAY_AT_6PM,
  //   //   async () => {
  //   //     await this.sendReport();
  //   //   },
  //   //   null,
  //   //   false,
  //   //   'Asia/Calcutta',
  //   // );
  //   // this.schedulerRegistry.addCronJob('report-2', job2);

  //   job1.start();
  // }

  async sendReport(req: TransactionReportDTO) {
    const inititatedListQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('customer', 'cust', 'cust.cust_id = payment.cust_id')
      .where('payment.status IN (:...status)', {
        status: [CustPaymentStatus.INITIATED, CustPaymentStatus.SUCCESS],
      });

    // .getRawMany();

    const successListQuery = await this.withdrawalRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('customer', 'cust', 'cust.cust_id = payment.cust_id')
      .where('payment.status = :status', {
        status: CustPaymentStatus.SUCCESS,
      });
    // .andWhere('payment.created_at BETWEEN :startDate and :endDate', reqObj);

    // .andWhere('payment.is_sent = :isSent', {
    //   isSent: false,
    // })
    // .getRawMany();

    let reqObj;
    if (req.end_date) {
      if (req.start_date == req.end_date) {
        reqObj = {
          startDate: req.start_date,
        };
      } else {
        reqObj = {
          startDate: req.start_date,
          endDate: req.end_date,
        };
      }
    } else {
      reqObj = {
        startDate: req.start_date,
      };
    }

    if (reqObj.endDate) {
      inititatedListQuery.andWhere(
        'DATE(payment.created_at) BETWEEN :startDate and :endDate',
        reqObj,
      );

      successListQuery.andWhere(
        'DATE(payment.created_at) BETWEEN :startDate and :endDate',
        reqObj,
      );
    } else {
      inititatedListQuery.andWhere('DATE(payment.created_at) = :gameDate', {
        gameDate: reqObj.startDate,
      });

      successListQuery.andWhere('DATE(payment.created_at) = :gameDate', {
        gameDate: reqObj.startDate,
      });
    }

    const inititatedList = await inititatedListQuery.getRawMany();
    const successList = await successListQuery.getRawMany();
    const workbook = new excel.Workbook();
    const sheet1 = workbook.addWorksheet('Withdrawal');
    const sheet2 = workbook.addWorksheet('Recharge');

    if (inititatedList.length || successList.length) {
      if (inititatedList.length) {
        const columns = [
          { column: 'Transaction No.', key: 'payment_cust_payment_id' },
          { column: 'Customer Id', key: 'payment_cust_id' },
          { column: 'First Name', key: 'cust_first_name' },
          { column: 'Last Name', key: 'cust_last_name' },
          { column: 'Contact Number', key: 'cust_mobile_no' },
          { column: 'Amount', key: 'payment_initiated_amount' },
          { column: 'Account Name', key: 'cust_account_name' },
          { column: 'Account No', key: 'cust_account_no' },
          { column: 'Account Type', key: 'cust_account_type' },
          { column: 'Bank Name', key: 'cust_bank_name' },
          { column: 'IFSC Code', key: 'cust_ifsc_code' },
        ];

        for (let i = 0; i < columns.length; i++) {
          for (let j = 0; j < inititatedList.length + 1; j++) {
            if (j == 0) {
              sheet1.cell(j + 1, i + 1).string(columns[i].column);
            } else {
              const identifier = columns[i].key;
              const val = inititatedList[j - 1][identifier].toString();
              if (val) {
                sheet1.cell(j + 1, i + 1).string(val);
              }
            }
          }
        }
      }

      if (successList.length) {
        const columns = [
          { column: 'Transaction No.', key: 'payment_payment_id' },
          { column: 'Customer Id', key: 'payment_cust_id' },
          { column: 'Bill No', key: 'payment_bill_id' },
          { column: 'First Name', key: 'cust_first_name' },
          { column: 'Last Name', key: 'cust_last_name' },
          { column: 'Contact Number', key: 'cust_mobile_no' },
          { column: 'Amount', key: 'payment_amount' },
          { column: 'Time', key: 'payment_created_at' },
        ];

        for (let i = 0; i < columns.length; i++) {
          for (let j = 0; j < successList.length + 1; j++) {
            if (j == 0) {
              sheet2.cell(j + 1, i + 1).string(columns[i].column);
            } else {
              const identifier = columns[i].key;
              let val = successList[j - 1][identifier].toString();
              if (identifier === 'payment_created_at' && val) {
                val = fromShared.Time.formatDateString(
                  successList[j - 1][identifier],
                );
              }
              if (val) {
                sheet2.cell(j + 1, i + 1).string(val);
              }
            }
          }
        }
      }

      const excelBuffer = await workbook.writeToBuffer().catch(e => {
        console.log(e);
      });
      const mailOptions = {
        from: process.env.EMAIL_ID,
        to: req.receiver_email || process.env.EMAIL_ID_REPORT,
        cc: 'girisanjay.8465@gmail.com,vinodkhoda@gmail.com',
        subject: `Payment Sheet - Pinnacle Matka`,
        html: `<div>
      <p>Hi Team,</p>
      <br/>
      <p>Please find the attached Payment Excel file.</p>
      <br/>
      <p>Regards,</p>
      <p>Pinnacle Matka </p>
      </div>`,
        attachments: [
          {
            filename: `Report-${fromShared.Time.getCurrentDate()}-${fromShared.Time.getTime()}.xlsx`,
            content: Buffer.from(excelBuffer, 'utf-8'),
          },
        ],
      };

      await this.emailService.sendEmail(mailOptions).catch(e => {
        console.log(e);

        throw fromShared.compose('Error while sending email');
      });
    }
  }

  async markReport(req: TransactionReportDTO) {
    const inititatedListQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('customer', 'cust', 'cust.cust_id = payment.cust_id')
      .where('payment.status = :status', {
        status: CustPaymentStatus.INITIATED,
      });

    let reqObj;
    if (req.end_date) {
      if (req.start_date == req.end_date) {
        reqObj = {
          startDate: req.start_date,
        };
      } else {
        reqObj = {
          startDate: req.start_date,
          endDate: req.end_date,
        };
      }
    } else {
      reqObj = {
        startDate: req.start_date,
      };
    }

    if (reqObj.endDate) {
      inititatedListQuery.andWhere(
        'DATE(payment.created_at) BETWEEN :startDate and :endDate',
        reqObj,
      );
    } else {
      inititatedListQuery.andWhere('DATE(payment.created_at) = :gameDate', {
        gameDate: reqObj.startDate,
      });
    }

    const inititatedList = await inititatedListQuery.getRawMany();

    console.log(inititatedList);
    if (inititatedList.length) {
      const ids = inititatedList.map(e => e.payment_cust_payment_id);

      if (ids.length) {
        this.paymentRepository
          .update(ids, { status: CustPaymentStatus.SUCCESS })
          .catch(e => {
            console.log(e);
            throw fromShared.compose('cannot update payment status');
          });
      }
    }
  }

  @Transaction()
  async newPaymentRequest(
    req: CustomerPaymentDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    // wallet entry

    const customer: any = classToPlain(
      await this.custRepository
        .findOne({
          where: {
            cust_id: req.cust_id,
            is_blocked: false,
            is_verified: true,
            status: true,
          },
        })
        .catch(e => {
          throw fromShared.compose('User not found');
        }),
    );

    if (!customer.is_kyc_completed) {
      throw fromShared.compose('KYC Details InComplete');
    }

    if (req.initiated_amount >= customer.points) {
      throw fromShared.compose(
        'Initiated Amount should be less than actual customer points',
      );
    }

    const updatedPoints = this.c2N(
      this.toF(customer.points - req.initiated_amount),
    );

    if (req.initiated_amount > this.c2N(this.toF(customer.points - 0.01))) {
      throw fromShared.compose('0.01 Rupees is Reserved');
    }

    const newPaymentRequest = new CustomerPayment();
    newPaymentRequest.initiated_amount = req.initiated_amount;
    newPaymentRequest.cust_id = req.cust_id;

    const cTxn = new CustomerTransaction();
    cTxn.particulars = `You requested withdrawal of amount ${req.initiated_amount} from your wallet`;
    cTxn.cust_id = customer.cust_id;
    cTxn.debit_amount = req.initiated_amount;
    cTxn.final_amount = updatedPoints;
    cTxn.transaction_type = fromShared.TrxnType.WALLET;

    await manager.save(cTxn);

    await manager.save(newPaymentRequest).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    await manager
      .update(Customer, customer.cust_id, { points: updatedPoints })
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    return {
      points: updatedPoints,
    };
  }

  @Transaction()
  async cancelPaymentRequest(
    req: CancelPaymentDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    // Time and wallet entry
    const payment = await this.paymentRepository
      .findOneOrFail({
        where: {
          cust_payment_id: req.cust_payment_id,
          status: CustPaymentStatus.INITIATED,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });

    const customer: any = classToPlain(
      await this.custRepository
        .findOne({
          where: {
            cust_id: payment.cust_id,
            is_blocked: false,
            is_verified: true,
            status: true,
          },
        })
        .catch(e => {
          throw fromShared.compose('User not found');
        }),
    );

    if (!customer.is_kyc_completed) {
      throw fromShared.compose('KYC Details InComplete');
    }

    const isTimeNotAvailable = fromShared.Time.getCancellationTime();

    if (isTimeNotAvailable) {
      throw fromShared.compose('Time expired');
    }

    await manager
      .update(CustomerPayment, payment.cust_payment_id, {
        status: CustPaymentStatus.CANCELLED,
      })
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const updatedPoints = this.c2N(
      this.toF(customer.points + payment.initiated_amount),
    );

    const cTxn = new CustomerTransaction();
    cTxn.particulars = `You cancelled withdrawal of amount ${payment.initiated_amount} from your wallet`;
    cTxn.cust_id = customer.cust_id;
    cTxn.credit_amount = payment.initiated_amount;
    cTxn.final_amount = updatedPoints;
    cTxn.transaction_type = fromShared.TrxnType.WALLET;

    await manager.save(cTxn);

    await manager
      .update(Customer, customer.cust_id, { points: updatedPoints })
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    return {
      points: updatedPoints,
    };
  }

  async allCustomerTransactions(req: CustomerPaymentPagination) {
    const payment = this.paymentRepository;
    const query = {
      where: {
        cust_id: req.cust_id,
      },
    };

    const totalCount = await payment.count(query);
    const paginated = await payment.find(
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
    let inititatedList = this.paymentRepository
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

    if (req.payment_cust_payment_id) {
      inititatedList = inititatedList.where('payment.cust_payment_id = :id', {
        id: +req.payment_cust_payment_id,
      });
      total = await inititatedList.getCount();
    }

    const finalData = await inititatedList
      .orderBy('payment.created_at', 'DESC')
      .offset(paginationResolver.skip)
      .limit(paginationResolver.take)
      .getRawMany()
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

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

  private c2N(num: string | number) {
    return typeof num === 'number' ? num : +num;
  }

  private toF(number: number) {
    return +number.toFixed(2);
  }
}
