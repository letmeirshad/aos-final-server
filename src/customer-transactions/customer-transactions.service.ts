import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerTransaction } from './customer-transactions.entity';
import { CustTransactionDTO } from './customer-transactions.dto';
import { Customer } from '../customer/customer.entity';
import * as fromShared from './../shared';
import { Admin } from '../admin/admin.entity';

@Injectable()
export class CustTransactionsService {
  constructor(
    @InjectRepository(CustomerTransaction)
    private readonly transactionsRepository: Repository<CustomerTransaction>,
    @InjectRepository(Customer)
    private readonly custRepository: Repository<Customer>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async findCustTrxn(req: CustTransactionDTO) {
    const finalOrder = req.order
      ? req.order
      : {
          created_at: 'DESC',
        };

    const paginationQuery = {
      where: {
        cust_id: req.cust_id,
      },
      order: finalOrder,
    };

    const total = await this.transactionsRepository.count({
      where: {
        cust_id: req.cust_id,
      },
    });

    const allData = await this.transactionsRepository.find(
      fromShared.PaginationService.paginate({
        totalData: total,
        currentPage: req.current_page,
        dataPerPage: req.data_per_page,
        query: paginationQuery,
      }),
    );

    return { total_data: total, table_data: allData };
  }

  async findWalletTrxn(req: CustTransactionDTO) {
    const customer = await this.custRepository
      .findOneOrFail({
        where: {
          cust_id: req.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });

    const admin = await this.adminRepository
      .findOneOrFail({
        where: {
          admin_id: req.admin_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });

    const finalOrder = req.order
      ? req.order
      : {
          created_at: 'DESC',
        };

    const paginationQuery = {
      where: {
        cust_id: req.cust_id,
        transaction_type: fromShared.TrxnType.WALLET,
      },
      order: finalOrder,
    };

    const total = await this.transactionsRepository.count({
      where: {
        cust_id: req.cust_id,
        transaction_type: fromShared.TrxnType.WALLET,
      },
    });

    const allData = await this.transactionsRepository.find(
      fromShared.PaginationService.paginate({
        totalData: total,
        currentPage: req.current_page,
        dataPerPage: req.data_per_page,
        query: paginationQuery,
      }),
    );

    return { total_data: total, table_data: allData };
  }
}
