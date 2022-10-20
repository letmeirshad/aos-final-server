import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  TransactionManager,
  EntityManager,
} from 'typeorm';
import { RefundPolicy } from './refund-policy.entity';
import { RefundDTO } from './refund.dto';
import * as fromShared from '../shared';
import { BetHistory } from '../bet-history/bet-history.entity';
import { AdminLedger } from '../admin-ledger/admin-ledger.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { Customer } from '../customer/customer.entity';
import { Admin } from '../admin/admin.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { Bazaar } from '../bazaar/bazaar.entity';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { Result } from '../results/results.entity';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(RefundPolicy)
    private readonly refundRepository: Repository<RefundPolicy>,
    @InjectRepository(BetHistory)
    private readonly betHistory: Repository<BetHistory>,
    // @InjectRepository(AdminCommison)
    // private readonly adminCommison: Repository<AdminCommison>,
    // @InjectRepository(Result)
    // private readonly resultRepository: Repository<Result>,
    // @InjectRepository(BazaarDate)
    // private readonly bazaarDateRepository: Repository<BazaarDate>,
    @InjectRepository(AdminLedger)
    private readonly adminLedger: Repository<AdminLedger>,
    // @InjectRepository(RetailerLedger)
    // private readonly retailerLedger: Repository<RetailerLedger>,
    // @InjectRepository(AgentLedger)
    // private readonly agentLedger: Repository<AgentLedger>,
    // @InjectRepository(AdminTransaction)
    // private readonly adminTransaction: Repository<AdminTransaction>,
    // @InjectRepository(CustomerTransaction)
    // private readonly customerTransaction: Repository<CustomerTransaction>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @Inject(BazaarService)
    private readonly bazaarService: BazaarService, // @InjectRepository(Bazaar) // private readonly bazaarRepository: Repository<Bazaar>,
  ) {}

  @Transaction()
  async refundAmount(
    req: RefundDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    const admin = this.adminRepository
      .findOneOrFail({
        where: {
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('User not found');
      });

    const currentBazaarDetails = await this.bazaarService.getBazaarDetails(
      req.bazaar_id,
    );
    const currentDate = currentBazaarDetails.booking_date
      ? currentBazaarDetails.booking_date
      : fromShared.Time.getCurrentDate();
    if (req.bazaar_date !== fromShared.Time.daysBack(1, currentDate)) {
      throw fromShared.compose('Can refund only prev day');
    }
    const bazaarDetails = await this.bazaarService.getBazaarDetails(
      req.bazaar_id,
      req.bazaar_date,
    );

    if (bazaarDetails.current_result) {
      throw fromShared.compose('Result Entered');
    }

    return;

    const betList = await this.betHistory.find({
      where: {
        bazaar_id: req.bazaar_id,
        game_date: req.bazaar_date,
        status: true,
      },
    });

    let bazaarInitials = fromShared.getBazaarInitials(bazaarDetails.bazaar_id);

    if (!betList.length) {
      throw fromShared.compose('No Bookings found');
    }

    const totalAmount = betList
      .map(e => e.total_amount)
      .reduce((a, b) => a + b);
    if (betList.length) {
      const betIds = betList.map(e => e.bet_id);
      await manager.update(BetHistory, betIds, { status: false }).catch(e => {
        fromShared.compose(fromShared.operationFailed);
      });

      betList.forEach(async e => {
        const customer = await this.customerRepository.findOneOrFail({
          where: {
            cust_id: e.cust_id,
          },
        });
        customer.points = customer.points + e.total_amount;

        await manager.save(customer).catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });

        const cTxn = new CustomerTransaction();
        cTxn.particulars = `Bazaar Cancelled ${bazaarInitials} ${e.game.game_name} ${e.selected_paana}`;
        cTxn.cust_id = customer.cust_id;
        cTxn.credit_amount = e.total_amount;
        cTxn.final_amount = customer.points;

        // await manager.save(cTxn).catch(e => {
        //   throw fromShared.compose(fromShared.operationFailed);
        // });
        // const commisions = await this.adminCommison.find({
        //   where: {
        //     bet_id: e.bet_id,
        //   },
        // });

        // commisions.forEach(async f => {
        //   const admin = await this.adminRepository.findOne({
        //     where: {
        //       admin_id: f.admin_id,
        //     },
        //   });

        //   if (admin.role_id === 2) {
        //     const adminLedger = await this.adminLedger.findOne({
        //       where: {
        //         ledger_date: req.bazaar_date,
        //       },
        //     });
        //     adminLedger.booking_amount = this.toF(
        //       this.c2N(adminLedger.booking_amount) - this.c2N(e.total_amount),
        //     );
        //     adminLedger.commission_amount = this.toF(
        //       this.c2N(adminLedger.commission_amount) -
        //         this.c2N(f.commission_amount),
        //     );
        //     adminLedger.calculated_ledger = this.toF(
        //       this.c2N(adminLedger.booking_amount) -
        //         this.c2N(adminLedger.commission_amount),
        //     );
        //     adminLedger.settled_difference = this.toF(
        //       this.c2N(adminLedger.calculated_ledger) -
        //         this.c2N(adminLedger.cashed_amount),
        //     );
        //     adminLedger.ledger_before_payment = this.calculateLedgerBeforePayment(
        //       this.c2N(adminLedger.calculated_ledger),
        //       this.c2N(adminLedger.last_day_remaining_ledger),
        //       this.c2N(adminLedger.cashed_amount),
        //     );
        //     adminLedger.ledger_after_payment = this.calculateLedgerAfterPayment(
        //       this.c2N(adminLedger.ledger_before_payment),
        //       this.c2N(adminLedger.paid_amount_for_day),
        //     );

        //     if (currentBazaarDetails.booking_date) {
        //       const prevAdminLedger = await this.adminLedger.findOne({
        //         where: {
        //           ledger_date: currentBazaarDetails.booking_date,
        //         },
        //       });

        //       if (prevAdminLedger) {
        //         prevAdminLedger.last_day_remaining_ledger =
        //           adminLedger.ledger_after_payment;
        //         prevAdminLedger.ledger_before_payment = this.calculateLedgerBeforePayment(
        //           this.c2N(prevAdminLedger.calculated_ledger),
        //           this.c2N(prevAdminLedger.last_day_remaining_ledger),
        //           this.c2N(prevAdminLedger.cashed_amount),
        //         );
        //         prevAdminLedger.ledger_after_payment = this.calculateLedgerAfterPayment(
        //           this.c2N(prevAdminLedger.ledger_before_payment),
        //           this.c2N(prevAdminLedger.paid_amount_for_day),
        //         );
        //         await manager.save(prevAdminLedger).catch(e => {
        //           throw fromShared.compose(fromShared.operationFailed);
        //         });
        //       }
        //     }
        //     await manager.save(adminLedger).catch(e => {
        //       throw fromShared.compose(fromShared.operationFailed);
        //     });
        //   } else if (admin.role_id === 3) {
        //     const agentLedger = await this.agentLedger.findOne();
        //     agentLedger.booking_amount = this.toF(
        //       this.c2N(agentLedger.booking_amount) - this.c2N(e.total_amount),
        //     );
        //     agentLedger.commission_amount = this.toF(
        //       this.c2N(agentLedger.commission_amount) -
        //         this.c2N(f.commission_amount),
        //     );
        //     agentLedger.calculated_ledger = this.toF(
        //       this.c2N(agentLedger.booking_amount) -
        //         this.c2N(agentLedger.commission_amount),
        //     );
        //     agentLedger.settled_difference = this.toF(
        //       this.c2N(agentLedger.calculated_ledger) -
        //         this.c2N(agentLedger.cashed_amount),
        //     );
        //     agentLedger.ledger_before_payment = this.calculateLedgerBeforePayment(
        //       this.c2N(agentLedger.calculated_ledger),
        //       this.c2N(agentLedger.last_day_remaining_ledger),
        //       this.c2N(agentLedger.cashed_amount),
        //     );
        //     agentLedger.ledger_after_payment = this.calculateLedgerAfterPayment(
        //       this.c2N(agentLedger.ledger_after_payment),
        //       this.c2N(agentLedger.paid_amount_for_day),
        //     );

        //     if (currentBazaarDetails.booking_date) {
        //       const prevAgentLedger = await this.adminLedger.findOne({
        //         where: {
        //           ledger_date: currentBazaarDetails.booking_date,
        //         },
        //       });

        //       if (prevAgentLedger) {
        //         prevAgentLedger.last_day_remaining_ledger =
        //           agentLedger.ledger_after_payment;
        //         prevAgentLedger.ledger_before_payment = this.calculateLedgerBeforePayment(
        //           this.c2N(prevAgentLedger.calculated_ledger),
        //           this.c2N(prevAgentLedger.last_day_remaining_ledger),
        //           this.c2N(prevAgentLedger.cashed_amount),
        //         );
        //         prevAgentLedger.ledger_after_payment = this.calculateLedgerAfterPayment(
        //           this.c2N(prevAgentLedger.ledger_before_payment),
        //           this.c2N(prevAgentLedger.paid_amount_for_day),
        //         );
        //         await manager.save(prevAgentLedger).catch(e => {
        //           throw fromShared.compose(fromShared.operationFailed);
        //         });
        //       }
        //     }
        //     await manager.save(agentLedger).catch(e => {
        //       throw fromShared.compose(fromShared.operationFailed);
        //     });
        //   } else {
        //     const retailerLedger = await this.retailerLedger.findOne();
        //     retailerLedger.booking_amount = this.toF(
        //       this.c2N(retailerLedger.booking_amount) -
        //         this.c2N(e.total_amount),
        //     );
        //     retailerLedger.commission_amount = this.toF(
        //       this.c2N(retailerLedger.commission_amount) -
        //         this.c2N(f.commission_amount),
        //     );
        //     retailerLedger.calculated_ledger = this.toF(
        //       this.c2N(retailerLedger.booking_amount) -
        //         this.c2N(retailerLedger.commission_amount),
        //     );
        //     retailerLedger.settled_difference = this.toF(
        //       this.c2N(retailerLedger.calculated_ledger) -
        //         this.c2N(retailerLedger.cashed_amount),
        //     );
        //     retailerLedger.ledger_before_payment = this.calculateLedgerBeforePayment(
        //       this.c2N(retailerLedger.calculated_ledger),
        //       this.c2N(retailerLedger.last_day_remaining_ledger),
        //       this.c2N(retailerLedger.cashed_amount),
        //     );
        //     retailerLedger.ledger_after_payment = this.calculateLedgerAfterPayment(
        //       this.c2N(retailerLedger.ledger_after_payment),
        //       this.c2N(retailerLedger.paid_amount_for_day),
        //     );

        //     if (currentBazaarDetails.booking_date) {
        //       const prevRetailerLedger = await this.adminLedger.findOne({
        //         where: {
        //           ledger_date: currentBazaarDetails.booking_date,
        //         },
        //       });

        //       if (prevRetailerLedger) {
        //         prevRetailerLedger.last_day_remaining_ledger =
        //           retailerLedger.ledger_after_payment;
        //         prevRetailerLedger.ledger_before_payment = this.calculateLedgerBeforePayment(
        //           this.c2N(prevRetailerLedger.calculated_ledger),
        //           this.c2N(prevRetailerLedger.last_day_remaining_ledger),
        //           this.c2N(prevRetailerLedger.cashed_amount),
        //         );
        //         prevRetailerLedger.ledger_after_payment = this.calculateLedgerAfterPayment(
        //           this.c2N(prevRetailerLedger.ledger_before_payment),
        //           this.c2N(prevRetailerLedger.paid_amount_for_day),
        //         );
        //         await manager.save(prevRetailerLedger).catch(e => {
        //           throw fromShared.compose(fromShared.operationFailed);
        //         });
        //       }
        //     }
        //     await manager.save(retailerLedger).catch(e => {
        //       throw fromShared.compose(fromShared.operationFailed);
        //     });
        //   }
        // });

        // if(admin.)
        // e.bet_id
      });
    }

    const newRefund = new RefundPolicy();
    newRefund.bazaar_date = req.bazaar_date;
    newRefund.total_amount = totalAmount;
    newRefund.bazaar_id = req.bazaar_id;

    await manager.save(newRefund).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  private calculateLedgerBeforePayment(
    calc_ledger,
    last_day_ledger,
    cashed_amount,
  ) {
    return this.toF(calc_ledger + last_day_ledger - cashed_amount);
  }

  private calculateLedgerAfterPayment(ledger_before, paid_amount) {
    return this.toF(ledger_before - paid_amount);
  }

  private c2N(num: string | number) {
    return typeof num === 'number' ? num : +num;
  }

  private toF(number: number) {
    return +number.toFixed(3);
  }
}
