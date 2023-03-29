import { Injectable, Inject, HttpService, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { map } from 'rxjs/operators';
//import { Fast2Sms } from 'fast-two-sms';
import {
  Repository,
  Transaction,
  TransactionManager,
  EntityManager,
  In,
  Like,
} from 'typeorm';
import { UpiPayment } from './upi-payment.entity';
import {
  UPIDTO,
  AllDataPagination
} from './upi-payment.dto';
import * as fromShared from './../shared';
import { Customer } from '../customer/customer.entity';
import { classToPlain } from 'class-transformer';

@Injectable()
export class UpiPaymentService {
  constructor(
    @InjectRepository(UpiPayment)
    private readonly upiPaymentRepository: Repository<UpiPayment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly http: HttpService
  ) { }

  async UpiPayment(req: UPIDTO) {

    const Pay = new UpiPayment();

    Pay.cust_id = req.cust_id;
    Pay.transaction_no = req.transaction_no;
    Pay.transaction_type = req.transaction_type;
    Pay.amount_point = req.amount_point;
    Pay.device_id = req.device_id;
    Pay.upi_provider = req.upi_provider;
    Pay.date_time = req.date_time;
    Pay.upi_id = req.upi_id;
    Pay.mobile_no = "+91" + req.mobile_no;

    const savePayment = await this.upiPaymentRepository
      .insert(Pay)
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    if (req.transaction_type == "2") {
      const customer = await this.customerRepository
        .findOneOrFail({
          where: { cust_id: req.cust_id, },
        })
        .catch(e => {
          throw fromShared.compose('User not found');
        });

      customer.points = customer.points + req.amount_point;

      await this.customerRepository
        .update(customer.cust_id, { points: customer.points })
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });
    }

    // var unirest = require("unirest");

    // var reqs = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");

    // reqs.headers({
    //   "authorization": "2NfTCiI9LxKajV0R1QAc5bGtyrPvMUD8dzSXJkuFpwe3BZlW7qmeB6SiLsKATHv3CPqGzuNwy7IbcJkM",
    //   "Content-Type": "application/json"
    // });

    // reqs.form({
    //   "route": "v3",
    //   "sender_id": "FTWSMS",
    //   "message": "1050",
    //   "language": "english",
    //   "flash": 0,
    //   "numbers": "7045055694",
    // });

    // reqs.end(function (res) {
    //   if (res.error) throw new Error(res.error);
    //   console.log(res.error);
    //   console.log(res.body);
    // });



    //Added By Faiz, --At 25/11/2022
    //const smsres = await Fast2Sms.sendMessage({ authorization: process.env.SMS_API_KEY, message: '1000', numbers: 7045055694 });
    //console.log(smsres);

    return classToPlain(
      await this.upiPaymentRepository.findOne({ where: { transaction_no: req.transaction_no, }, }),
    );
  }

  async allUpiTransactions(req: AllDataPagination) {
    let total = await this.upiPaymentRepository.count();
    const paginationResolver = fromShared.PaginationService.paginateQueryBuilder(
      { totalData: total, currentPage: req.current_page },
    );
    let inititatedList = this.upiPaymentRepository
      .createQueryBuilder('upi_payment')
      .innerJoinAndSelect(Customer, 'cust', 'cust.cust_id = upi_payment.cust_id');

    if (req.cust_id) {
      inititatedList = inititatedList.where('cust.cust_id = :id', {
        id: +req.cust_id,
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

    if (req.mobile_no) {
      inititatedList = inititatedList.where('cust.mobile_no like :mobile_no', {
        mobile_no: `%${req.mobile_no}%`,
      });
      total = await inititatedList.getCount();
    }

    const finalData = await inititatedList
      .orderBy('upi_payment.created_at', 'DESC')
      .offset(paginationResolver.skip)
      .limit(paginationResolver.take)
      .getRawMany()
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const modifiedData = finalData.map(data => {
      data.transaction_id = data.upi_payment_transaction_id;
      data.cust_id = data.cust_cust_id;
      data.full_name = `${data.cust_first_name} ${data.cust_last_name}`;
      data.mobile_no = data.cust_mobile_no;
      data.transaction_type = (data.upi_payment_transaction_type == 1 ? 'start'
        : ((data.upi_payment_transaction_type == 2 ? 'success' : 'failed')));
      data.amount_point = data.upi_payment_amount_point;
      data.upi_provider = data.upi_payment_upi_provider;
      data.created_at = fromShared.Time.formatDateString(
        data.upi_payment_date_time,
      );
      return data;
    });

    return {
      total_data: total,
      table_data: modifiedData,
    };
  }

  async getLast10UpiTransaction(req: AllDataPagination) {
    const payment = this.upiPaymentRepository;
    const query = {
      where: {
        cust_id: req.cust_id,
        transaction_type: "2"
      },
    };

    const totalCount = await payment.count(query);

    const paginated = classToPlain(

      // await payment.find(
      //   fromShared.PaginationService.paginate({
      //     totalData: totalCount,
      //     currentPage: req.current_page,
      //     query: {
      //       ...query,
      //       ...{
      //         order: {
      //           created_at: 'DESC',
      //         },
      //       },
      //     },
      //   }),
      // ),

      await payment.find({
        where: {
          cust_id: req.cust_id,
          transaction_type: "2"
        },
        take: 10
      }
      )

    );

    return {
      total_data: totalCount,
      table_data: paginated,
    };
  }

  async SendSms() {

    const url = 'http://mysms.msg24.in/api/mt/SendSMS?' +
      'user=ShreeBalaji' +
      '&password=123456' +
      '&senderid=RNITBP' +
      '&route=08' +
      '&channel=TRANS' +
      '&DCS=0' +
      '&flashsms=0' +
      '&number=7045055694' +
      '&text=Dear Customer, your otp is 2154. please do not share with anyone. Thanks RNIT' +
      '&Peid=1701159142353280489' +
      '&DLTTemplateId=1707166961595017353'

    const response = this.http.get(url).toPromise();

    console.log(response);
    return classToPlain(response);
  }
}
