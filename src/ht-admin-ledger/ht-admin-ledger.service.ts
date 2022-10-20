import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { HTAdminLedger } from './ht-admin-ledger.entity';
import { HTAdminReportDTO } from './ht-admin-ledger.dto';
import * as fromShared from '../shared';
import { HTConfig } from '../ht-config/ht-config.entity';

@Injectable()
export class HTAdminLedgerService {
  constructor(
    @InjectRepository(HTAdminLedger)
    private readonly adminLedgerRepository: Repository<HTAdminLedger>,

    @InjectRepository(HTConfig)
    private readonly configRepository: Repository<HTConfig>,
  ) {}

  async findReport(req: HTAdminReportDTO): Promise<HTAdminLedger[]> {
    return await this.adminLedgerRepository.find({
      where: {
        ledger_date: req.ledger_date,
      },
    });
  }

  async findPaymetHistory(): Promise<HTAdminLedger[]> {
    return await this.adminLedgerRepository.find({
      where: {
        paid_amount_for_day: Not(0),
      },
    });
  }

  async findLedger() {
    const existingLedgers = await this.adminLedgerRepository.find({
      order: {
        ledger_date: 'DESC',
      },
    });

    if (!existingLedgers.length) {
      return {
        starting_ledger: 0,
      };
    }

    const checkStatus = existingLedgers[0];

    if (
      checkStatus.payment_status === fromShared.PaymentStatus.PARTIAL_PAID ||
      checkStatus.payment_status === fromShared.PaymentStatus.FULLY_PAID
    ) {
      return {
        starting_ledger: checkStatus.ledger_after_payment,
        dates: checkStatus.ledger_date,
      };
    }

    if (checkStatus.payment_status === fromShared.PaymentStatus.NOT_PAID) {
      const ledgers = await this.adminLedgerRepository.find({
        where: {
          payment_status: fromShared.PaymentStatus.NOT_PAID,
        },
        order: {
          ledger_date: 'DESC',
        },
      });

      return {
        ledger_data: ledgers,
        total_unpaid: checkStatus.ledger_after_payment,
        starting_ledger:
          existingLedgers[existingLedgers.length - 1].last_day_remaining_ledger,
        dates: `${existingLedgers[existingLedgers.length - 1].ledger_date} - ${
          checkStatus.ledger_date
        }`,
      };
    }
  }

  async getPaymentDetails() {
    const configList = await this.configRepository.find();

    if (!configList.length) {
      throw fromShared.compose('Config not found');
    }
    const config = configList[0];

    const ledgerList = await this.adminLedgerRepository.find({
      order: {
        ledger_date: 'DESC',
      },
    });

    if (ledgerList.length) {
      if (ledgerList[0].ledger_date === fromShared.Time.getCurrentDate()) {
        if (ledgerList.length > 1) {
          if (ledgerList[1].ledger_after_payment < 0) {
            return { total_amount: 0.0 };
          }
          return {
            total_amount: this.toF(
              (this.c2N(ledgerList[1].ledger_after_payment) / 100) *
                1,
            ),
          };
        } else {
          return {
            total_amount: 0.0,
          };
        }
      } else {
        if (ledgerList[0].ledger_after_payment < 0) {
          return { total_amount: 0.0 };
        }
        return {
          total_amount: ledgerList[0].ledger_after_payment,
        };
      }
    } else {
      return {
        total_amount: 0.0,
      };
    }
  }

  private c2N(num: string | number) {
    return typeof num === 'number' ? num : +num;
  }

  private toF(number: number) {
    return +number.toFixed(3);
  }
}
