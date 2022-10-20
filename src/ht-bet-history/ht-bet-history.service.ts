import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  EntityManager,
  TransactionManager,
  Connection,
  In,
} from 'typeorm';
import { HTBetHistory } from './ht-bet-history.entity';
import {
  HTBetHistoryDTO,
  CancelBetDTO,
  BetHistoryListDTO,
} from './ht-bet-history.dto';
import { Customer } from '../customer/customer.entity';
import * as fromShared from '../shared';

import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';

import { HTConfig } from '../ht-config/ht-config.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { HTAdminLedger } from '../ht-admin-ledger/ht-admin-ledger.entity';
import { Admin } from '../admin/admin.entity';
import { HTResult } from '../ht-results/ht-results.entity';
import { HTSlot } from '../ht-slot/ht-slot.entity';
@Injectable()
export class HTBetHistoryService {
  constructor(
    @InjectRepository(HTBetHistory)
    private readonly betHistoryRepository: Repository<HTBetHistory>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomGame)
    private readonly customGameRepository: Repository<CustomGame>,
    @InjectRepository(HTConfig)
    private readonly configRepository: Repository<HTConfig>,

    @InjectRepository(HTAdminLedger)
    private readonly htAdminLedgerRepository: Repository<HTAdminLedger>,
    @InjectRepository(HTResult)
    private readonly htResultRepository: Repository<HTResult>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(HTSlot)
    private readonly htSlotRepository: Repository<HTSlot>,
  ) {}

  // Change exisiting slot
  @Transaction()
  async create(
    bet: HTBetHistoryDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    const bet_total_amount = bet.total_amount;

    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          status: true,
          cust_id: bet.cust_id,
          is_blocked: false,
          is_verified: true
        },
      })
      .catch(e => {
        throw fromShared.compose('Customer not found');
      });

    const slots = await this.htSlotRepository.find().catch(e => {
      throw fromShared.compose('Slot data not found');
    });

    if (!slots.length) {
      throw fromShared.compose('Slot data not found');
    }

    const configs = await this.configRepository.find();
    let config: HTConfig;
    if (configs.length) {
      config = configs[0];
    } else {
      throw fromShared.compose('Config not found');
    }

    const currentSlotData = fromShared.Time.getCurrentSlot(
      slots,
      config.close_before_seconds,
    );

    if (!currentSlotData) {
      throw fromShared.compose('Cannot find current Slot');
    }

    const currentSlot = currentSlotData.slot_no;

    const currentDate = currentSlotData.slot_date;

    const existingData = await this.betHistoryRepository.find({
      where: {
        slot: currentSlot,
        game_date: currentDate,
        cust_id: bet.cust_id,
        bet_type: bet.bet_type,
      },
    });

    if (bet_total_amount > customer.points) {
      throw { udm_message: 'Insufficient Points' };
    }

    const isTimeNotExpired = fromShared.Time.isHTRemainingTime(
      currentSlotData.slot_start_timing,
      currentSlotData.slot_end_timing,
    );

    if (!isTimeNotExpired) {
      throw fromShared.compose('Time Expired');
    }

    let newBet;

    if (existingData.length) {
      newBet = existingData[0];
      newBet.total_amount = newBet.total_amount + bet_total_amount;
    } else {
      newBet = new HTBetHistory();
      newBet.total_amount = bet_total_amount;
    }

    if (newBet.total_amount > config.maximum_bet_amount) {
      throw fromShared.compose('Maximum amount reached');
    }

    newBet.customer = customer;
    newBet.game_date = currentDate;
    newBet.slot = currentSlot;
    newBet.bet_type = bet.bet_type;

    let oldCustomerPoints = customer.points;
    customer.points = customer.points - bet_total_amount;
    const currentBet = await manager.save(newBet).catch(e => {
      throw fromShared.compose(`Current Bet ${fromShared.operationFailed}`);
    });
    const updatedCustomer = await manager.save(customer).catch(e => {
      throw fromShared.compose(
        `Updating Customer Info ${fromShared.operationFailed}`,
      );
    });

    const gameDetails = await this.customGameRepository
      .findOneOrFail({
        where: {
          game_id: fromShared.GAMES_CUST.HT,
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find game');
      });

    const dTxn = new CustomerTransaction();
    dTxn.particulars = gameDetails.game_name;
    dTxn.cust_id = updatedCustomer.cust_id;
    dTxn.debit_amount = currentBet.total_amount;
    oldCustomerPoints = oldCustomerPoints - currentBet.total_amount;
    dTxn.final_amount = oldCustomerPoints;

    await manager.save(dTxn).catch(e => {
      throw fromShared.compose(
        `Customer Transactions ${fromShared.operationFailed}`,
      );
    });

    /// Retailer
    let adminLedger: HTAdminLedger;

    const existingAdmin = await manager.findOne(HTAdminLedger, {
      where: {
        ledger_date: currentDate,
      },
    });

    const lastAdmins = await this.calculateLastLedgerRetailer(manager);

    let lastDayRetailerLedger;
    if (lastAdmins.length) {
      if (lastAdmins[0].ledger_date === currentDate) {
        if (lastAdmins.length > 1) {
          lastDayRetailerLedger = lastAdmins[1];
        } else {
          lastDayRetailerLedger = null;
        }
      } else {
        lastDayRetailerLedger = lastAdmins[0];
      }
    } else {
      lastDayRetailerLedger = null;
    }

    const retailerCalculatedLedger = this.calculateRetailerLedger(
      existingAdmin
        ? this.toF(
            this.c2N(existingAdmin.booking_amount) + this.c2N(bet_total_amount),
          )
        : this.c2N(bet_total_amount),
      existingAdmin ? this.toF(this.c2N(existingAdmin.cashed_amount)) : 0,
    );

    const retailerLedgerBefore = retailerCalculatedLedger;
    const retailerPaidAmountDay = existingAdmin
      ? this.c2N(existingAdmin.paid_amount_for_day)
      : 0;
    const retailerLedgerAfter = this.calculateLedgerAfterPayment(
      retailerLedgerBefore,
      retailerPaidAmountDay,
    );

    if (existingAdmin) {
      adminLedger = existingAdmin;
      adminLedger.booking_amount = this.toF(
        this.c2N(adminLedger.booking_amount) + this.c2N(bet_total_amount),
      );
    } else {
      adminLedger = new HTAdminLedger();
      adminLedger.ledger_date = currentDate;
      adminLedger.booking_amount = this.c2N(bet_total_amount);
    }

    adminLedger.calculated_ledger = this.c2N(retailerCalculatedLedger);
    adminLedger.last_day_remaining_ledger = lastDayRetailerLedger
      ? this.c2N(lastDayRetailerLedger.ledger_after_payment)
      : 0;
    adminLedger.ledger_before_payment = this.c2N(retailerLedgerBefore);
    adminLedger.ledger_after_payment = this.c2N(retailerLedgerAfter);
    await manager.save(adminLedger).catch(e => {
      throw fromShared.compose(`Retailer Ledger ${fromShared.operationFailed}`);
    });

    // /// Agents
    // let agentLedger: HTAgentLedger;
    // const existingAgent = await manager.findOne(HTAgentLedger, {
    //   where: {
    //     ledger_date: currentDate,
    //     admin_id: agentAdmin.admin_id,
    //   },
    // });
    // const lastAgents = await this.calculateLastLedgerAgent(
    //   agentAdmin.admin_id,
    //   manager,
    // );
    // let lastDayAgentLedger;
    // if (lastAgents.length) {
    //   if (lastAgents[0].ledger_date === currentDate) {
    //     if (lastAgents.length > 1) {
    //       lastDayAgentLedger = lastAgents[1];
    //     } else {
    //       lastDayAgentLedger = null;
    //     }
    //   } else {
    //     lastDayAgentLedger = lastAgents[0];
    //   }
    // } else {
    //   lastDayAgentLedger = null;
    // }

    // const retailers = await this.getRetailers(agentAdmin.admin_id, manager);
    // const retailersBookingAmount = retailers
    //   .filter(e => e.ledger_date === currentDate)
    //   .map(e => this.c2N(e.booking_amount))
    //   .reduce((e, f) => this.c2N(e) + this.c2N(f));

    // const retailersCashedAmount = retailers
    //   .filter(e => e.ledger_date === currentDate)
    //   .map(e => this.c2N(e.cashed_amount))
    //   .reduce((e, f) => this.c2N(e) + this.c2N(f));

    // const agentCalculatedLedger = this.calculateRetailerLedger(
    //   retailersBookingAmount,
    //   retailersCashedAmount,
    // );

    // const agentLedgerBefore = agentCalculatedLedger;
    // const agentPaidAmountDay = 0;
    // const agentLedgerAfter = this.calculateLedgerAfterPayment(
    //   agentLedgerBefore,
    //   agentPaidAmountDay,
    // );

    // if (existingAgent) {
    //   agentLedger = existingAgent;
    // } else {
    //   agentLedger = new HTAgentLedger();
    //   agentLedger.ledger_date = currentDate;
    //   agentLedger.admin_id = agentAdmin.admin_id;
    // }
    // agentLedger.booking_amount = this.toF(this.c2N(retailersBookingAmount));
    // agentLedger.calculated_ledger = this.c2N(agentCalculatedLedger);
    // agentLedger.last_day_remaining_ledger = lastDayAgentLedger
    //   ? this.c2N(lastDayAgentLedger.ledger_after_payment)
    //   : 0;
    // agentLedger.ledger_before_payment = this.c2N(agentLedgerBefore);
    // agentLedger.ledger_after_payment = this.c2N(agentLedgerAfter);
    // await manager.save(agentLedger).catch(e => {
    //   throw fromShared.compose(`Agent Ledger ${fromShared.operationFailed}`);
    // });

    return {
      cust_id: updatedCustomer.cust_id,
      points: updatedCustomer.points,
      ...currentBet,
    };
  }

  @Transaction()
  async cancel(
    bet: CancelBetDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    const betData = await this.betHistoryRepository.find({
      where: {
        slot: bet.slot_id,
        cust_id: bet.cust_id,
      },
    });

    if (!betData.length) {
      throw fromShared.compose('Bet not found');
    }

    const betResult = await this.htResultRepository
      .find({
        where: {
          game_date: betData[0].game_date,
          slot: betData[0].slot,
        },
      })
      .catch(e => {
        throw fromShared.compose('Can not find Result');
      });

    if (betResult.length) {
      throw fromShared.compose('Result Already Declared');
    }
    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          status: true,
          cust_id: bet.cust_id,
          is_blocked: false,
          is_verified: true
        },
      })
      .catch(e => {
        throw fromShared.compose('Customer not found');
      });

    const currentSlot = await this.htSlotRepository
      .findOneOrFail({
        where: {
          slot_no: betData[0].slot,
        },
      })
      .catch(e => {
        throw fromShared.compose('Error in finding slot');
      });

    const betAmounts = betData.map(e => e.total_amount).reduce((a, b) => a + b);

    const isTimeNotExpired = fromShared.Time.isHTRemainingTime(
      currentSlot.slot_start_timing,
      currentSlot.slot_end_timing,
    );

    if (!isTimeNotExpired) {
      fromShared.compose('Time Expired');
    }

    let oldCustomerPoints = customer.points;
    customer.points = customer.points + betAmounts;
    const betIds = betData.map(e => e.bet_id);
    const currentBet = await manager.delete(HTBetHistory, betIds).catch(e => {
      throw fromShared.compose(`Current Bet ${fromShared.operationFailed}`);
    });
    const updatedCustomer = await manager.save(customer).catch(e => {
      throw fromShared.compose(
        `Updating Customer Info ${fromShared.operationFailed}`,
      );
    });

    const gameDetails = await this.customGameRepository
      .findOneOrFail({
        where: {
          game_id: fromShared.GAMES_CUST.HT,
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find game');
      });

    const dTxn = new CustomerTransaction();
    dTxn.particulars = `You cancelled ${gameDetails.game_name}`;
    dTxn.cust_id = updatedCustomer.cust_id;
    dTxn.credit_amount = betAmounts;
    oldCustomerPoints = oldCustomerPoints + betAmounts;
    dTxn.final_amount = oldCustomerPoints;

    await manager.save(dTxn).catch(e => {
      throw fromShared.compose(
        `Customer Transactions ${fromShared.operationFailed}`,
      );
    });

    return {
      cust_id: updatedCustomer.cust_id,
      points: updatedCustomer.points,
    };
  }

  async betList(filter: BetHistoryListDTO) {
    const total = await this.betHistoryRepository
      .count({
        where: {
          cust_id: filter.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const data = await this.betHistoryRepository
      .find(
        fromShared.PaginationService.paginate({
          totalData: total,
          currentPage: filter.current_page,
          dataPerPage: filter.data_per_page,
          query: {
            where: {
              cust_id: filter.cust_id,
            },
            order: {
              created_at: 'DESC',
            },
          },
        }),
      )
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    let finalData = [];

    if (data.length) {
      finalData = data.map(async (bet: any) => {
        const resultData = await this.htResultRepository.find({
          where: {
            slot: bet.slot,
          },
        });

        if (resultData.length) {
          bet.result = resultData[0].bet_type;
        } else {
          bet.result = null;
        }

        return bet;
      });
    }
    const allData = data.length ? await Promise.all(finalData) : [];

    return { total_data: total, table_data: allData };
  }

  private c2N(num: string | number) {
    return typeof num === 'number' ? num : +num;
  }

  private toF(number: number) {
    return +number.toFixed(3);
  }

  private async calculateLastLedgerRetailer(manager) {
    const retailer = await manager.find(HTAdminLedger, {
      order: {
        created_at: 'DESC',
      },
    });

    return retailer;
  }

  private calculateRetailerLedger(booking_amount, cashed_amount) {
    return this.toF(booking_amount - cashed_amount);
  }

  private calculateLedgerAfterPayment(ledger_before, paid_amount) {
    return this.toF(ledger_before - paid_amount);
  }

  private async calculateLastLedgerAgent(manager) {
    return await manager.find(HTAdminLedger, {
      order: {
        created_at: 'DESC',
      },
    });
  }
}
