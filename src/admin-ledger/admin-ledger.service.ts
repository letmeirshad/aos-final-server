import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminLedger } from './admin-ledger.entity';
import { AdminReportDTO } from './admin-ledger.dto';
import * as fromShared from '../shared';
import { Admin } from '../admin/admin.entity';

@Injectable()
export class AdminLedgerService {
  constructor(
    @InjectRepository(AdminLedger)
    private readonly adminLedgerRepository: Repository<AdminLedger>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async findReport(req: AdminReportDTO): Promise<AdminLedger[]> {
    // const admin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: req.admin_id,
    //     },
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('User not found');
    //   });

    // const parentAdmin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: req.parent_admin_id,
    //     },
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('User not found');
    //   });

    // if (
    //   parentAdmin.role_id === fromShared.ROLES.SUPER_ADMIN ||
    //   parentAdmin.role_id === fromShared.ROLES.ADMIN ||
    //   admin.admin_id === req.parent_admin_id ||
    //   admin.parent_admin_id === req.parent_admin_id
    // ) {
    return await this.adminLedgerRepository.find({
      where: {
        ledger_date: req.ledger_date,
      },
    });
    // } else {
    //   throw fromShared.compose('Unauthorized');
    // }
  }

  // async findPaymetHistory(req: AdminLedgerDTO): Promise<AdminLedger[]> {
  //   const admin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: req.admin_id,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('User not found');
  //     });

  //   const parentAdmin = await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id: req.parent_admin_id,
  //       },
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('User not found');
  //     });

  //   if (
  //     parentAdmin.role_id === fromShared.ROLES.SUPER_ADMIN ||
  //     parentAdmin.role_id === fromShared.ROLES.ADMIN ||
  //     admin.admin_id === req.parent_admin_id ||
  //     admin.parent_admin_id === req.parent_admin_id
  //   ) {
  //     return await this.adminLedgerRepository.find({
  //       where: {
  //         admin_id: req.admin_id,
  //         paid_amount_for_day: Not(0),
  //       },
  //     });
  //   } else {
  //     throw fromShared.compose('Unauthorized');
  //   }
  // }

  async findLedger(req) {
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

    // const admin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: req.admin_id,
    //     },
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('User not found');
    //   });

    // const parentAdmin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: req.parent_admin_id,
    //     },
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('User not found');
    //   });

    // if (
    //   parentAdmin.role_id === fromShared.ROLES.SUPER_ADMIN ||
    //   parentAdmin.role_id === fromShared.ROLES.ADMIN ||
    //   admin.admin_id === req.parent_admin_id ||
    //   admin.parent_admin_id === req.parent_admin_id
    // ) {
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
    // } else {
    //   fromShared.compose('Unauthorized');
    // }
  }

  async getPaymentDetails(req) {
    const ledgerList = await this.adminLedgerRepository.find({
      order: {
        ledger_date: 'DESC',
      },
    });

    if (ledgerList.length) {
      if (ledgerList[0].ledger_date === fromShared.Time.getCurrentDate()) {
        if (ledgerList.length > 1) {
          return {
            total_amount: ledgerList[1].ledger_after_payment,
          };
        } else {
          return {
            total_amount: 0.0,
          };
        }
      } else {
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
}
