import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  EntityManager,
  TransactionManager,
  In,
  Like,
} from 'typeorm';
import { BetHistory } from './bet-history.entity';
import {
  BetHistoryDTO,
  BetHistoryFilterDTO,
  ClaimDTO,
  DashboardDTO,
  BetPaanaList,
  BetAnalysisDTO,
} from './bet-history.dto';
import { Bazaar } from '../bazaar/bazaar.entity';
import { Game } from '../game/game.entity';
import { Customer } from '../customer/customer.entity';
import * as fromShared from './../shared';
import { BazaarService } from '../bazaar/bazaar.service';
import { Result } from '../results/results.entity';
import { ConfigService } from '../configuration/configuration.service';
import { SingleResult } from '../single-result/single-result.entity';
import { Paana } from '../paana/paana.entity';
import { CpPaana } from '../cp-paana/cp-paana.entity';
import { Admin } from '../admin/admin.entity';
// import { RetailerLedger } from '../retailer-ledger/retailer-ledger.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { AdminLedger } from '../admin-ledger/admin-ledger.entity';
import { from } from 'rxjs';
import { Chart } from '../chart/chart.entity';
import { AdminAnalysis } from '../admin-analysis/admin-analysis.entity';
import e = require('express');

@Injectable()
export class BetHistoryService {
  constructor(
    @InjectRepository(BetHistory)
    private readonly betHistoryRepository: Repository<BetHistory>,
    @InjectRepository(Bazaar)
    private readonly bazaarRepository: Repository<Bazaar>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Result)
    private readonly resultRepository: Repository<Result>,
    @InjectRepository(SingleResult)
    private readonly singleResultRepository: Repository<SingleResult>,
    @InjectRepository(Paana)
    private readonly paanaRepository: Repository<Paana>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(CpPaana)
    private readonly cpPaanaRespository: Repository<CpPaana>,
    @InjectRepository(AdminAnalysis)
    private readonly adminAnalysisRepository: Repository<AdminAnalysis>,
    // @InjectRepository(RetailerLedger)
    // private readonly retialerLedgerRespository: Repository<RetailerLedger>,
    @InjectRepository(Chart)
    private readonly chartRepository: Repository<Chart>,
    @Inject(BazaarService)
    private readonly bazaarService: BazaarService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  @Transaction({ isolation: 'SERIALIZABLE' })
  async create(
    bet: BetHistoryDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    const bets: BetHistory[] = [];
    const trxns: CustomerTransaction[] = [];
    const existingMaps = {};
    // const commisions = [];
    // let retailerAdmin;
    // let agentAdmin;
    // let sAdmin;

    // let retailerCommision = 0;
    // let agentCommision = 0;
    let adminCommision = 0;

    const bet_total_amount = bet.paanas
      .map(e => {
        return e.total_amount;
      })
      .reduce((e, f) => {
        return e + f;
      });

    const validatedPaanas = await this.getValidPaanas(bet.game_id);
    // const validAmounts = await this.getValidAmounts(bet.game_id);

    if (
      bet.game_id === fromShared.GAMES.SINGLE ||
      bet.game_id === fromShared.GAMES.PAANA ||
      bet.game_id === fromShared.GAMES.CP ||
      bet.game_id === fromShared.GAMES.CHART ||
      bet.game_id === fromShared.GAMES.COMMON
    ) {
      bet.paanas.forEach(e => {
        const isValid = validatedPaanas.filter(
          paana => e.selected_paana === paana,
        );
        if (!isValid.length) {
          throw fromShared.compose('Invalid Paana');
        }
      });
    }

    const bazaarTimingDetails = await this.bazaarService
      .getBazaarDetails(bet.bazaar_id)
      .catch(e => {
        throw fromShared.compose('Cannot fetch bazaar timings');
      });

    const bazaar = await this.bazaarRepository
      .findOneOrFail({
        where: {
          status: true,
          bazaar_id: bet.bazaar_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Bazaar not found');
      });

    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          status: true,
          cust_id: bet.cust_id,
          is_blocked: false,
          // is_blocked_by_admin: false,
          is_verified: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Customer not found');
      });

    const game = await this.gameRepository
      .findOneOrFail({
        where: {
          status: true,
          game_id: bet.game_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Game not found');
      });

    if (bet_total_amount > customer.points) {
      throw { udm_message: 'Insufficient Points' };
    }

    if (
      !bazaarTimingDetails.booking_date ||
      bazaarTimingDetails.booking_date !== bet.game_date
    ) {
      throw { udm_message: 'Invalid date' };
    }

    if (!bazaarTimingDetails.remaining_time) {
      throw { udm_message: 'Time expired' };
    }

    bet.paanas.forEach(e => {
      const newBet = new BetHistory();
      newBet.game = game;
      newBet.customer = customer;
      newBet.bazaar = bazaar;
      newBet.game_date = bet.game_date;
      newBet.selected_paana = e.selected_paana;
      newBet.total_amount = e.total_amount;
      newBet.amount_per_paana = e.amount_per_paana;
      newBet.is_result_declared = false;
      if (e.paana_type) {
        newBet.paana_type = e.paana_type;
      }
      newBet.status = bet.status;
      newBet.created_by = bet.created_by;
      newBet.updated_by = bet.updated_by;
      bets.push(newBet);
    });

    let oldCustomerPoints = customer.points;
    customer.points = customer.points - bet_total_amount;
    const currentBet = await manager.save(bets).catch(e => {
      throw fromShared.compose(`Current Bet ${fromShared.operationFailed}`);
    });
    const updatedCustomer = await manager.save(customer).catch(e => {
      throw fromShared.compose(
        `Updating Customer Info ${fromShared.operationFailed}`,
      );
    });

    let bazaarInitials = fromShared.getBazaarInitials(bazaar.bazaar_id);

    for (let i = 0; i < currentBet.length; i++) {
      const e = currentBet[i];
      if (bet.game_id === fromShared.GAMES.PAANA) {
        let anlaysis: AdminAnalysis = null;
        const findExisting = await manager.findOne(AdminAnalysis, {
          where: {
            game_date: bet.game_date,
            bazaar_id: bet.bazaar_id,
            paana_no: e.selected_paana,
          },
        });

        if (findExisting) {
          anlaysis = findExisting;
          anlaysis.amount = e.amount_per_paana + findExisting.amount;
        } else {
          anlaysis = new AdminAnalysis();
          anlaysis.amount = e.amount_per_paana;
        }
        anlaysis.bazaar_id = e.bazaar_id;
        anlaysis.game_date = e.game_date;
        anlaysis.paana_no = e.selected_paana;

        console.log('paana analysis', anlaysis);

        await manager.save(anlaysis).catch(e => {
          throw fromShared.compose(`Current Bet ${fromShared.operationFailed}`);
        });
      }

      if (bet.game_id === fromShared.GAMES.CP) {
        const cpPaana = await this.cpPaanaRespository.findOneOrFail({
          where: {
            cp_paana_no: e.selected_paana,
          },
        });

        const paanas = cpPaana.cp_combinations.map(e => e.paana.paana_no);

        const paanasPromise = paanas.map(async paana => {
          let anlaysis: AdminAnalysis = null;
          const findExisting = await manager.findOne(AdminAnalysis, {
            where: {
              game_date: bet.game_date,
              bazaar_id: bet.bazaar_id,
              paana_no: paana,
            },
          });

          // if (existingMaps[e.selected_paana]) {
          //   existingMaps[e.selected_paana] =
          //     existingMaps[e.selected_paana] + e.amount_per_paana;
          // } else if (!existingMaps[e.selected_paana] && findExisting) {
          //   existingMaps[e.selected_paana] =
          //     e.amount_per_paana + findExisting.amount;
          // } else {
          //   existingMaps[e.selected_paana] = e.amount_per_paana;
          // }

          if (findExisting) {
            anlaysis = findExisting;
            anlaysis.amount = e.amount_per_paana + findExisting.amount;
          } else {
            anlaysis = new AdminAnalysis();
            anlaysis.amount = e.amount_per_paana;
          }
          anlaysis.bazaar_id = e.bazaar_id;
          anlaysis.game_date = e.game_date;
          anlaysis.paana_no = paana;
          console.log('cp analysis', anlaysis);

          await manager.save(anlaysis).catch(e => {
            throw fromShared.compose(
              `Current Bet ${fromShared.operationFailed}`,
            );
          });
        });

        await Promise.all(paanasPromise);
      }

      if (bet.game_id === fromShared.GAMES.MOTOR) {
        const betNo = e.selected_paana.split('');
        let paanas = [];

        if (e.paana_type === 'SP') {
          for (let i = 0; i < betNo.length - 2; i++) {
            for (let j = i + 1; j < betNo.length; j++) {
              for (let k = j + 1; k < betNo.length; k++) {
                paanas.push(`${betNo[i]}${betNo[j]}${betNo[k]}`);
              }
            }
          }
        }

        if (e.paana_type === 'DP') {
          for (let i = 0; i < betNo.length - 1; i++) {
            for (let j = i + 1; j < betNo.length; j++) {
              paanas.push(`${betNo[i]}${betNo[i]}${betNo[j]}`);
            }

            for (let k = i + 1; k < betNo.length; k++) {
              paanas.push(`${betNo[i]}${betNo[k]}${betNo[k]}`);
            }
          }
        }

        if (e.paana_type === 'TP') {
          for (let i = 0; i < betNo.length; i++) {
            paanas.push(`${betNo[i]}${betNo[i]}${betNo[i]}`);
          }
        }

        const paanasPromise = paanas.map(async paana => {
          let anlaysis: AdminAnalysis = null;
          const findExisting = await manager.findOne(AdminAnalysis, {
            where: {
              game_date: bet.game_date,
              bazaar_id: bet.bazaar_id,
              paana_no: paana,
            },
          });

          if (findExisting) {
            anlaysis = findExisting;
            anlaysis.amount = anlaysis.amount + e.amount_per_paana;
          } else {
            anlaysis = new AdminAnalysis();
            anlaysis.amount = e.amount_per_paana;
          }
          anlaysis.bazaar_id = e.bazaar_id;
          anlaysis.game_date = e.game_date;
          anlaysis.paana_no = paana;
          console.log('motor analysis', anlaysis);

          await manager.save(anlaysis).catch(e => {
            throw fromShared.compose(
              `Current Bet ${fromShared.operationFailed}`,
            );
          });
        });

        const resultd = await Promise.all(paanasPromise);
      }

      if (bet.game_id === fromShared.GAMES.CHART) {
        let paanas = [];
        const charts = await this.chartRepository.find({
          where: {
            chart_name: e.selected_paana,
          },
        });

        if (charts.length) {
          paanas = charts.map(e => e.paana_no);
        } else {
          throw fromShared.compose('can not find paanas');
        }

        const paanasPromise = paanas.map(async paana => {
          let anlaysis: AdminAnalysis = null;
          const findExisting = await manager.findOne(AdminAnalysis, {
            where: {
              game_date: bet.game_date,
              bazaar_id: bet.bazaar_id,
              paana_no: paana,
            },
          });

          if (findExisting) {
            anlaysis = findExisting;
            anlaysis.amount = anlaysis.amount + e.amount_per_paana;
          } else {
            anlaysis = new AdminAnalysis();
            anlaysis.amount = e.amount_per_paana;
          }
          anlaysis.bazaar_id = e.bazaar_id;
          anlaysis.game_date = e.game_date;
          anlaysis.paana_no = paana;

          console.log('chart analysis', anlaysis);

          await manager.save(anlaysis).catch(e => {
            throw fromShared.compose(
              `Current Bet ${fromShared.operationFailed}`,
            );
          });
        });
        await Promise.all(paanasPromise);
      }

      if (bet.game_id === fromShared.GAMES.COMMON) {
        let paanas = [];

        if (e.paana_type === 'SP') {
          let spPaanas = await this.paanaRepository.find({
            where: {
              paana_type: 'SP',
              paana_no: Like(`%${e.selected_paana}%`),
            },
          });

          paanas = spPaanas.map(e => e.paana_no);
        }

        if (e.paana_type === 'DP') {
          let dpPaanas = await this.paanaRepository.find({
            where: {
              paana_type: 'DP',
              paana_no: Like(`%${e.selected_paana}%`),
            },
          });

          paanas = dpPaanas.map(e => e.paana_no);
        }

        if (e.paana_type === 'TP') {
          let tpPaanas = await this.paanaRepository.find({
            where: {
              paana_type: 'TP',
              paana_no: Like(`%${e.selected_paana}%`),
            },
          });

          paanas = tpPaanas.map(e => e.paana_no);
        }

        if (!paanas.length) {
          throw fromShared.compose('can not find paanas');
        }

        const paanasPromise = paanas.map(async paana => {
          let anlaysis: AdminAnalysis = null;
          const findExisting = await manager.findOne(AdminAnalysis, {
            where: {
              game_date: bet.game_date,
              bazaar_id: bet.bazaar_id,
              paana_no: paana,
            },
          });

          if (findExisting) {
            anlaysis = findExisting;
            anlaysis.amount = anlaysis.amount + e.amount_per_paana;
          } else {
            anlaysis = new AdminAnalysis();
            anlaysis.amount = e.amount_per_paana;
          }
          anlaysis.bazaar_id = e.bazaar_id;
          anlaysis.game_date = e.game_date;
          anlaysis.paana_no = paana;
          console.log('common analysis', anlaysis);

          await manager.save(anlaysis).catch(e => {
            throw fromShared.compose(
              `Current Bet ${fromShared.operationFailed}`,
            );
          });
        });
        await Promise.all(paanasPromise);
      }

      const dTxn = new CustomerTransaction();
      dTxn.particulars = `${bazaarInitials} ${game.game_name} ${e.selected_paana}`;
      dTxn.cust_id = updatedCustomer.cust_id;
      dTxn.debit_amount = e.total_amount;
      oldCustomerPoints = oldCustomerPoints - e.total_amount;
      dTxn.final_amount = oldCustomerPoints;
      trxns.push(dTxn);

      // retailerAdmin = await this.getAdminInfo(customer.admin_id);
      const adminCommisionConf = await this.getGameCommsion(e.game_id);

      const adminCommisonAmount = this.calculateCommision(
        (this.c2N(e.total_amount) / 100) * this.c2N(adminCommisionConf),
      );

      adminCommision = adminCommision + adminCommisonAmount;
      await manager.save(trxns).catch(e => {
        throw fromShared.compose(
          `Customer Transactions ${fromShared.operationFailed}`,
        );
      });
    }
    // const promiseCollection = currentBet.map(async e => {

    //   // commisions.push(adminCommison);
    //   // adminCommision = adminCommision + adminCommison.commission_amount;
    // });

    // await Promise.all(promiseCollection);

    // await manager.save(commisions).catch(e => {
    //   throw fromShared.compose(`Admin Commision ${fromShared.operationFailed}`);
    // });

    /// Retailer
    let adminLedger: AdminLedger;

    const existingAdminLedger = await manager.findOne(AdminLedger, {
      where: {
        ledger_date: bet.game_date,
      },
    });
    const listAdminLedgers = await this.calculateLastLedgerAdmin(manager);
    let lastDayAdminLedger;
    if (listAdminLedgers.length) {
      if (listAdminLedgers[0].ledger_date === bet.game_date) {
        if (listAdminLedgers.length > 1) {
          lastDayAdminLedger = listAdminLedgers[1];
        } else {
          lastDayAdminLedger = null;
        }
      } else {
        lastDayAdminLedger = listAdminLedgers[0];
      }
    } else {
      lastDayAdminLedger = null;
    }

    const adminCalculatedLedger = this.calculateAdminLedger(
      existingAdminLedger
        ? this.toF(
            this.c2N(existingAdminLedger.booking_amount) +
              this.c2N(bet_total_amount),
          )
        : this.c2N(bet_total_amount),
      existingAdminLedger
        ? this.toF(
            this.c2N(existingAdminLedger.commission_amount) +
              this.c2N(adminCommision),
          )
        : this.c2N(adminCommision),
    );

    const adminSettledLedger = this.calculateDiff(
      adminCalculatedLedger,
      existingAdminLedger ? this.c2N(existingAdminLedger.cashed_amount) : 0,
    );
    const adminLedgerBefore = this.calculateLedgerBeforePayment(
      adminSettledLedger,
      lastDayAdminLedger
        ? this.c2N(lastDayAdminLedger.ledger_after_payment)
        : 0,
    );
    const adminPaidAmountDay = existingAdminLedger
      ? this.c2N(existingAdminLedger.paid_amount_for_day)
      : 0;
    const adminLedgerAfter = this.calculateLedgerAfterPayment(
      adminLedgerBefore,
      adminPaidAmountDay,
    );

    if (existingAdminLedger) {
      adminLedger = existingAdminLedger;
      adminLedger.booking_amount = this.toF(
        this.c2N(adminLedger.booking_amount) + this.c2N(bet_total_amount),
      );
      adminLedger.commission_amount = this.toF(
        this.c2N(adminLedger.commission_amount) + this.c2N(adminCommision),
      );
    } else {
      adminLedger = new AdminLedger();
      adminLedger.ledger_date = bet.game_date;
      adminLedger.booking_amount = this.c2N(bet_total_amount);
      adminLedger.commission_amount = this.c2N(adminCommision);
    }
    adminLedger.calculated_ledger = this.c2N(adminCalculatedLedger);
    adminLedger.last_day_remaining_ledger = lastDayAdminLedger
      ? this.c2N(lastDayAdminLedger.ledger_after_payment)
      : 0;
    adminLedger.ledger_before_payment = this.c2N(adminLedgerBefore);
    adminLedger.ledger_after_payment = this.c2N(adminLedgerAfter);
    adminLedger.settled_difference = this.c2N(adminSettledLedger);
    await manager.save(adminLedger).catch(e => {
      throw fromShared.compose(`Admin Ledger ${fromShared.operationFailed}`);
    });
    return {
      cust_id: updatedCustomer.cust_id,
      points: updatedCustomer.points,
    };
  }

  // async findRetailerLedger(admin_id, date) {
  //   return await this.retialerLedgerRespository.findOne({
  //     where: {
  //       admin_id,
  //       ledger_date: date,
  //     },
  //   });
  // }

  private calculateAdminLedger(booking_amount, commission_amount) {
    return this.toF(booking_amount - commission_amount);
  }

  // private calculateAgentLedger(
  //   booking_amount,
  //   commission_amount,
  //   retailer_commision_amount,
  // ) {
  //   return this.toF(
  //     booking_amount - (commission_amount + retailer_commision_amount),
  //   );
  // }

  // private calculateAdminLedger(
  //   booking_amount,
  //   commission_amount,
  //   retailer_commision_amount,
  //   agent_commision_amount,
  // ) {
  //   return this.toF(
  //     booking_amount -
  //       (commission_amount +
  //         retailer_commision_amount +
  //         agent_commision_amount),
  //   );
  // }

  private calculateDiff(calculated_ledger, cashed_amount) {
    return this.toF(calculated_ledger - cashed_amount);
  }

  private calculateLedgerBeforePayment(settled_difference, last_day_ledger) {
    return this.toF(settled_difference + last_day_ledger);
  }

  private calculateCommision(commison) {
    return this.toF(commison);
  }

  private c2N(num: string | number) {
    return typeof num === 'number' ? num : +num;
  }

  private toF(number: number) {
    return +number.toFixed(3);
  }

  private async getValidPaanas(gameId) {
    if (
      gameId === fromShared.GAMES.SINGLE ||
      gameId === fromShared.GAMES.MOTOR
    ) {
      const singles = await this.singleResultRepository
        .createQueryBuilder()
        .select('DISTINCT(single_value)', 'selected_paana')
        .orderBy('single_value', 'ASC')
        .getRawMany();

      const convertPaanas = singles.map(e => e.selected_paana.toString());
      return convertPaanas;
    } else if (gameId === fromShared.GAMES.PAANA) {
      const paanas = await this.paanaRepository.find({
        select: ['paana_no'],
      });
      const convertPaanas = paanas.map(e => e.paana_no);
      return convertPaanas;
    } else if (gameId === fromShared.GAMES.CP) {
      const cpPaanas = await this.cpPaanaRespository.find({
        select: ['cp_paana_no'],
      });
      const convertPaanas = cpPaanas.map(e => e.cp_paana_no);
      return convertPaanas;
    } else if (gameId === fromShared.GAMES.CHART) {
      const chartPaanas = await this.chartRepository.find({
        select: ['chart_name'],
      });
      const chartData = chartPaanas.map(e => e.chart_name);
      return chartData;
    } else if (gameId === fromShared.GAMES.COMMON) {
      const validPaanas = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      return validPaanas;
    }
  }

  // private async getValidAmounts(gameId) {
  //   const game = await this.gameRepository.findOne({
  //     where: {
  //       game_id: gameId,
  //     },
  //     relations: ['amounts'],
  //   });

  //   const gameAmounts = game.amounts.map(e => e.amount_value);
  //   return gameAmounts;
  // }

  private calculateLedgerAfterPayment(ledger_before, paid_amount) {
    return this.toF(ledger_before - paid_amount);
  }

  // private async calculateLastLedgerRetailer(admin_id, manager) {
  //   const retailer = await manager.find(RetailerLedger, {
  //     where: {
  //       admin_id,
  //     },
  //     order: {
  //       created_at: 'DESC',
  //     },
  //   });

  //   return retailer;
  // }

  private async calculateLastLedgerAdmin(manager) {
    const admin = await manager.find(AdminLedger, {
      order: {
        created_at: 'DESC',
      },
    });
    return admin;
  }

  // private async calculateLastLedgerAgent(admin_id, manager) {
  //   return await manager.find(AgentLedger, {
  //     where: {
  //       admin_id,
  //     },
  //     order: {
  //       created_at: 'DESC',
  //     },
  //   });
  // }

  // private async getRetailers(admin_id, manager) {
  //   const agents: RetailerLedger[] = [];
  //   const admin = await this.adminRepository.findOne({
  //     where: {
  //       admin_id,
  //     },
  //     relations: ['children'],
  //   });

  //   const childrens = admin.children.map(e => e.admin_id);
  //   const promiseCollection = childrens.map(async e => {
  //     const retailer = await this.calculateLastLedgerRetailer(e, manager);
  //     if (retailer.length) {
  //       agents.push(retailer[0]);
  //     }
  //   });

  //   await Promise.all(promiseCollection);
  //   return agents;
  // }

  // private async getAgents(admin_id, manager) {
  //   const agents: AgentLedger[] = [];
  //   const admin = await this.adminRepository.findOne({
  //     where: {
  //       admin_id,
  //     },
  //     relations: ['children'],
  //   });

  //   const childrens = admin.children.map(e => e.admin_id);
  //   const promiseCollection = childrens.map(async e => {
  //     const agent = await this.calculateLastLedgerAgent(e, manager);
  //     if (agent.length) {
  //       agents.push(agent[0]);
  //     }
  //   });
  //   await Promise.all(promiseCollection);

  //   return agents;
  // }

  async findAll(): Promise<BetHistory[]> {
    return await this.betHistoryRepository.find();
  }

  // private async getAdminInfo(admin_id) {
  //   return await this.adminRepository
  //     .findOneOrFail({
  //       where: {
  //         admin_id,
  //       },
  //       select: ['admin_id', 'parent_admin_id', 'role_id'],
  //     })
  //     .catch(e => {
  //       throw fromShared.compose('Admin not found');
  //     });
  // }

  private async getGameCommsion(game_id) {
    if (game_id === fromShared.GAMES.SINGLE) {
      const single = await this.configService.findByKey('admin_single');
      return +single.config_value;
    } else {
      const all = await this.configService.findByKey('admin_all');
      return +all.config_value;
    }
  }

  async betPaanas(game: BetPaanaList) {
    // const admin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: game.admin_id,
    //       status: true,
    //       is_blocked: false,
    //     },
    //     relations: ['children'],
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('user not found');
    //   });

    // const childAdminsID = admin.children.map(e => e.admin_id);
    let customers;

    const findCustomers = await this.customerRepository.find();
    customers = findCustomers.map(e => e.cust_id);

    if (game.game_id === fromShared.GAMES.SINGLE) {
      const paanas = [];
      const allPaanas = await this.singleResultRepository
        .createQueryBuilder()
        .select('DISTINCT(single_value)', 'selected_paana')
        .orderBy('single_value', 'ASC')
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(
            `all Paanas fetching ${fromShared.operationFailed}`,
          );
        });
      let betQuery = this.betHistoryRepository
        .createQueryBuilder()
        .groupBy('bazaar_id')
        .addGroupBy('game_id')
        .addGroupBy('selected_paana')
        .select('SUM(total_amount)', 'total_paana_amount')
        .where('game_id = :gameId', {
          gameId: game.game_id,
        })
        .andWhere('bazaar_id = :bazaarId', {
          bazaarId: game.bazaar_id,
        })
        .andWhere('game_date = :gameDate', {
          gameDate: game.game_date,
        })
        .andWhere('status = :betStatus', {
          betStatus: true,
        });

      if (customers) {
        betQuery = betQuery.andWhere('cust_id IN (:...ids)', {
          ids: customers,
        });
      }

      const bets = await betQuery
        .addSelect('selected_paana')
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(
            `all bets fetching ${fromShared.operationFailed}`,
          );
        });

      const convertPaanas = allPaanas.map(e => e.selected_paana.toString());
      for (let i = 0; i < convertPaanas.length; i++) {
        const filtered = bets.filter(
          e => e.selected_paana === convertPaanas[i],
        );
        if (filtered.length) {
          paanas.push({
            total_paana_amount: filtered[0].total_paana_amount,
            selected_paana: convertPaanas[i],
          });
        } else {
          paanas.push({
            total_paana_amount: 0,
            selected_paana: convertPaanas[i],
          });
        }
      }

      return paanas;
    }

    if (game.game_id === fromShared.GAMES.PAANA) {
      const paanas = [];
      const allPaanas = await this.paanaRepository
        .createQueryBuilder()
        .select('paana_no')
        .orderBy('paana_no', 'ASC')
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });

      let betQuery = this.betHistoryRepository
        .createQueryBuilder()
        .groupBy('bazaar_id')
        .addGroupBy('game_id')
        .addGroupBy('selected_paana')
        .select('SUM(total_amount)', 'total_paana_amount')
        .where('game_id = :gameId', {
          gameId: game.game_id,
        })
        .andWhere('bazaar_id = :bazaarId', {
          bazaarId: game.bazaar_id,
        })
        .andWhere('game_date = :gameDate', {
          gameDate: game.game_date,
        })
        .andWhere('status = :betStatus', {
          betStatus: true,
        });

      if (customers) {
        betQuery = betQuery.andWhere('cust_id IN (:...ids)', {
          ids: customers,
        });
      }

      const bets = await betQuery
        .addSelect('selected_paana')
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });

      const convertPaanas = allPaanas.map(e => e.paana_no);
      for (let i = 0; i < convertPaanas.length; i++) {
        const filtered = bets.filter(
          e => e.selected_paana === convertPaanas[i],
        );
        if (filtered.length) {
          paanas.push({
            total_paana_amount: filtered[0].total_paana_amount,
            selected_paana: convertPaanas[i],
          });
        } else {
          paanas.push({
            total_paana_amount: 0,
            selected_paana: convertPaanas[i],
          });
        }
      }

      return paanas;
    }

    if (game.game_id === fromShared.GAMES.CP) {
      const paanas = [];
      const allPaanas = await this.cpPaanaRespository
        .createQueryBuilder()
        .select('DISTINCT(cp_paana_no)', 'selected_paana')
        .orderBy('cp_paana_no', 'ASC')
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });
      let betQuery = this.betHistoryRepository
        .createQueryBuilder()
        .groupBy('bazaar_id')
        .addGroupBy('game_id')
        .addGroupBy('selected_paana')
        .select('SUM(total_amount)', 'total_paana_amount')
        .where('game_id = :gameId', {
          gameId: game.game_id,
        })
        .andWhere('bazaar_id = :bazaarId', {
          bazaarId: game.bazaar_id,
        })
        .andWhere('game_date = :gameDate', {
          gameDate: game.game_date,
        })
        .andWhere('status = :betStatus', {
          betStatus: true,
        });

      if (customers) {
        betQuery = betQuery.andWhere('cust_id IN (:...ids)', {
          ids: customers,
        });
      }

      const bets = await betQuery
        .addSelect('selected_paana')
        .getRawMany()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });

      const convertPaanas = allPaanas.map(e => e.selected_paana.toString());
      for (let i = 0; i < convertPaanas.length; i++) {
        const filtered = bets.filter(
          e => e.selected_paana === convertPaanas[i],
        );
        if (filtered.length) {
          paanas.push({
            total_paana_amount: filtered[0].total_paana_amount,
            selected_paana: convertPaanas[i],
          });
        } else {
          paanas.push({
            total_paana_amount: 0,
            selected_paana: convertPaanas[i],
          });
        }
      }

      return paanas;
    }
  }

  async detailBetList(filter) {
    const order = filter.order ? filter.order : null;
    const fullName = filter.full_name
      ? [
          { first_name: Like(`%${filter.full_name.toLowerCase()}%`) },
          { last_name: Like(`%${filter.full_name.toLowerCase()}%`) },
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
    //       admin_id: filter.admin_id,
    //       status: true,
    //       is_blocked: false,
    //     },
    //     relations: ['children'],
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('user not found');
    //   });

    // const childAdminsID = admin.children.map(e => e.admin_id);
    let selectedPaana;

    selectedPaana = filter.paanas.length ? In(filter.paanas) : null;

    let customers;

    const findCustomers = await this.customerRepository.find();
    customers = findCustomers.map(e => e.cust_id);

    const filterQuery = {
      bazaar_id: filter.bazaar_id ? filter.bazaar_id : null,
      game_id: filter.game_id ? filter.game_id : null,
      game_date: filter.game_date ? filter.game_date : '',
      cust_id: customers && customers.length ? In(customers) : [],
      selected_paana: filter.selected_paana
        ? filter.selected_paana
        : selectedPaana,

      status: true,
    };

    if (customers === null) {
      filterQuery.cust_id = null;
    }

    Object.keys(filterQuery).forEach(e => {
      if (!filterQuery[e]) {
        delete filterQuery[e];
      }
    });

    const total = await this.betHistoryRepository.count({
      where: filterQuery,
    });

    const resultData = await this.resultRepository.findOne({
      where: {
        game_date: filter.game_date,
        bazaar_id: filter.bazaar_id,
      },
    });

    const finalOrder = order ? order : { created_at: 'DESC' };

    const paginationQuery = {
      where: filterQuery,
      relations: ['game', 'customer'],
      order: finalOrder,
    };

    const data = await this.betHistoryRepository
      .find(
        fromShared.PaginationService.paginate({
          totalData: total,
          currentPage: filter.current_page,
          dataPerPage: filter.data_per_page ? filter.data_per_page : null,
          query: paginationQuery,
        }),
      )
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const tableData = data.map(async (e: any) => {
      const bazaarData = await this.bazaarService.getBazaarDetails(e.bazaar_id);
      e.bazaar_name = bazaarData.bazaar_name;
      e.game_name = e.game.game_name;
      e.result =
        resultData && resultData.result_paana && resultData.result_single_value
          ? `${resultData.result_paana}-${resultData.result_single_value}`
          : null;
      e.full_name = e.customer.first_name + ' ' + e.customer.last_name;
      delete e.customer;
      delete e.game;
      return e;
    });

    const allData = await Promise.all(tableData);

    return { total_data: total, table_data: allData };
  }

  async betList(filter: BetHistoryFilterDTO) {
    const filterQuery = {
      bazaar_id: filter.bazaar_id ? filter.bazaar_id : null,
      game_id: filter.game_id ? filter.game_id : null,
      game_date: filter.game_date ? filter.game_date : '',
      cust_id: filter.cust_id ? filter.cust_id : null,
      status: true,
    };

    Object.keys(filterQuery).forEach(e => {
      if (!filterQuery[e]) {
        delete filterQuery[e];
      }
    });

    const total = await this.betHistoryRepository
      .count({
        where: filterQuery,
      })
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const paginationQuery = {
      where: filterQuery,
      relations: ['game'],
      order: {
        created_at: 'DESC',
      },
    };
    const data = await this.betHistoryRepository
      .find(
        fromShared.PaginationService.paginate({
          totalData: total,
          currentPage: filter.current_page,
          dataPerPage: filter.data_per_page ? filter.data_per_page : null,
          query: paginationQuery,
        }),
      )
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const resultData = await this.resultRepository.findOne({
      where: {
        game_date: filter.game_date,
        bazaar_id: filter.bazaar_id,
      },
    });

    const tableData = data.map(async (e: any) => {
      const bazaarData = await this.bazaarService.getBazaarDetails(e.bazaar_id);
      e.bazaar_name = bazaarData.bazaar_name;
      e.game_name = e.game.game_name;
      e.result = resultData
        ? `${resultData.result_paana}-${resultData.result_single_value}`
        : null;
      delete e.game;
      return e;
    });

    const allData = await Promise.all(tableData);

    return { total_data: total, table_data: allData };
  }

  async getDashboardData(req: DashboardDTO) {
    // const admin = await this.adminRepository
    //   .findOneOrFail({
    //     where: {
    //       admin_id: req.admin_id,
    //       status: true,
    //       is_blocked: false,
    //     },
    //     relations: ['children'],
    //   })
    //   .catch(e => {
    //     throw fromShared.compose('user not found');
    //   });
    // const childAdminsID = admin.children.map(e => e.admin_id);

    let customers;

    const findCustomers = await this.customerRepository.find();
    customers = findCustomers.map(e => e.cust_id);

    const allBazaars = await this.bazaarService.findAll();
    const gamesList = await this.gameRepository.find({
      select: ['game_name', 'game_id'],
    });

    const isAnotherDay = fromShared.Time.isMidNight();
    const bazaarDate = req.game_date
      ? req.game_date
      : isAnotherDay
      ? fromShared.Time.daysBack(1)
      : fromShared.Time.getCurrentDate();
    const bazaarList = allBazaars.map(e => {
      return {
        bazaar_id: e.bazaar_id,
        bazaar_name: e.bazaar_name,
        is_open_for_booking: e.is_open_for_booking,
        booking_date: e.booking_date,
      };
    });

    const betsQuery = await this.betHistoryRepository
      .createQueryBuilder()
      .groupBy('bazaar_id')
      .addGroupBy('game_id')
      .select('SUM(total_amount)', 'total_game_amount')
      .addSelect('game_id')
      .addSelect('bazaar_id')
      .where('game_date = :date', {
        date: bazaarDate,
      })
      .andWhere('status = :betStatus', {
        betStatus: true,
      });
    const bets =
      customers && customers.length
        ? await betsQuery
            .andWhere('cust_id IN (:...custIds)', {
              custIds: customers,
            })
            .getRawMany()
        : [];

    const dashboardData = bazaarList.map(bazaar => {
      const games = gamesList.map((game: any) => {
        const filterGame = bets.filter(
          e => e.game_id === game.game_id && e.bazaar_id === bazaar.bazaar_id,
        );
        const totals = filterGame.length
          ? { total_game_amount: filterGame[0].total_game_amount }
          : { total_game_amount: 0 };
        return { ...game, ...totals };
      });

      const gamesAmount = games.map(e => e.total_game_amount);

      return {
        bazaar,
        games,
        total_bazaar_amount: gamesAmount.reduce(
          (pv, nv) => parseInt(pv) + parseInt(nv),
        ),
      };
    });
    return {
      date: fromShared.Time.dateFormatter(bazaarDate),
      dashboardDatas: dashboardData,
    };
  }

  @Transaction()
  async claimBet(
    claimData: ClaimDTO,
    @TransactionManager() manager: EntityManager,
  ) {
    const betData = await this.betHistoryRepository
      .findOneOrFail({
        where: {
          bet_id: claimData.bet_id,
          is_winner: true,
          is_claimed: false,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot found bet');
      });

    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: betData.cust_id,
          status: true,
          is_blocked: false,
          is_verified: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot found Customer');
      });

    const game = await this.gameRepository
      .findOneOrFail({
        where: {
          game_id: betData.game_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot found game');
      });

    const isAnotherDay = fromShared.Time.isMidNight();
    const bazaarDate = isAnotherDay
      ? fromShared.Time.daysBack(1)
      : fromShared.Time.getCurrentDate();
    const bazaarDetails = await this.bazaarService.getBazaarDetails(
      betData.bazaar_id,
    );

    const result = await this.resultRepository
      .findOneOrFail({
        where: {
          game_date: betData.game_date,
          bazaar_id: betData.bazaar_id,
        },
        relations: ['cp_combinations', 'chart_combinations'],
      })
      .catch(e => {
        throw fromShared.compose('Cannot found result');
      });

    let bazaarInitials = fromShared.getBazaarInitials(betData.bazaar_id);

    // const admin = await this.getAdminInfo(agent.parent_admin_id);

    let confkey = null;
    if (betData.game_id === fromShared.GAMES.SINGLE) {
      if (result.result_single_value.toString() === betData.selected_paana) {
        confkey = 'single_amount';
      } else {
        throw 'Not a winner';
      }
    } else if (betData.game_id === fromShared.GAMES.CHART) {
      const chartResults = result.chart_combinations.filter(
        e => e.chart_name === betData.selected_paana,
      );
      if (!chartResults.length) {
        throw 'Not a winner';
      }
      confkey = result.result_type;
    } else if (betData.game_id === fromShared.GAMES.COMMON) {
      const data = result.result_paana
        .split('')
        .some(c => betData.selected_paana.includes(c));

      if (!data) {
        throw 'Not a winner';
      }

      if (result.result_type !== betData.paana_type) {
        throw 'Not a winner';
      }
      confkey = result.result_type;
    } else if (betData.game_id === fromShared.GAMES.PAANA) {
      if (result.result_paana !== betData.selected_paana) {
        throw 'Not a winner';
      }
      confkey = result.result_type;
    } else if (betData.game_id === fromShared.GAMES.CP) {
      const cpResults = result.cp_combinations.filter(
        e => e.paana_combination === betData.selected_paana,
      );
      if (cpResults.length) {
        confkey = result.result_type;
      } else {
        throw 'Not a winner';
      }
    } else if (betData.game_id === fromShared.GAMES.MOTOR) {
      if (
        result.result_paana
          .split('')
          .every(c => betData.selected_paana.includes(c))
      ) {
        confkey = result.result_type;
      } else {
        throw 'Not a winner';
      }
    } else if (betData.game_id === fromShared.GAMES.BRACKETS) {
      const result = await this.resultRepository
        .findOneOrFail({
          where: {
            game_date: betData.game_date,
            bazaar_id: fromShared.getInverse(betData.bazaar_id),
          },
        })
        .catch(e => {
          throw fromShared.compose('Cannot found result');
        });

      if (result.bracket_result === betData.selected_paana) {
        confkey = 'bracket_amount';
      } else {
        throw 'Not a winner';
      }
    }

    const conf = await this.configService.findByKey(confkey);
    if (conf) {
      betData.winning_amount = betData.amount_per_paana * +conf.config_value;
      betData.is_claimed = true;
      customer.points = customer.points + betData.winning_amount;
      const customerData: any = await manager.save(customer).catch(e => {
        fromShared.compose(fromShared.operationFailed);
      });

      const cTxn = new CustomerTransaction();
      cTxn.particulars = `You Won ${bazaarInitials} ${game.game_name} ${betData.selected_paana}`;
      cTxn.cust_id = customer.cust_id;
      cTxn.credit_amount = betData.winning_amount;
      cTxn.final_amount = customer.points;

      let adminLedger: AdminLedger;
      const existingAdminLedger = await manager.findOne(AdminLedger, {
        where: {
          ledger_date: bazaarDate,
        },
      });

      const prevAdmin = await manager.findOne(AdminLedger, {
        order: {
          created_at: 'DESC',
        },
      });

      if (!prevAdmin) {
        throw fromShared.compose('Admin Entry not found');
      }

      if (existingAdminLedger) {
        adminLedger = existingAdminLedger;
        adminLedger.cashed_amount = this.toF(
          +adminLedger.cashed_amount + +betData.winning_amount,
        );
        adminLedger.ledger_before_payment = this.toF(
          +adminLedger.ledger_before_payment - betData.winning_amount,
        );
        adminLedger.ledger_after_payment = adminLedger.ledger_before_payment;
        adminLedger.settled_difference = this.toF(
          this.c2N(adminLedger.calculated_ledger) -
            this.c2N(adminLedger.cashed_amount),
        );
      } else {
        adminLedger = new AdminLedger();
        adminLedger.ledger_date = bazaarDate;
        adminLedger.booking_amount = 0;
        adminLedger.commission_amount = 0;
        adminLedger.cashed_amount = +betData.winning_amount;
        adminLedger.calculated_ledger = 0;
        adminLedger.ledger_before_payment = this.toF(
          +prevAdmin.ledger_after_payment - +betData.winning_amount,
        );
        adminLedger.last_day_remaining_ledger = +prevAdmin.ledger_after_payment;
        adminLedger.ledger_after_payment = adminLedger.ledger_before_payment;
        adminLedger.settled_difference = this.toF(
          this.c2N(adminLedger.calculated_ledger) -
            this.c2N(adminLedger.cashed_amount),
        );
      }

      await manager.save(adminLedger).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

      await manager.save(cTxn).catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
      const betHistoryData: any = await manager.save(betData).catch(e => {
        fromShared.compose(fromShared.operationFailed);
      });

      betHistoryData.bazaar_name = bazaarDetails.bazaar_name;
      betHistoryData.game_name = game.game_name;
      betHistoryData.result = `${result.result_paana}-${result.result_single_value}`;

      betHistoryData.updated_points = customerData.points;

      return betHistoryData;
    } else {
      throw fromShared.compose('Cannot find configuration value');
    }

    // if (result.result_single_value.toString() === betData.selected_paana) {
    //   const single = await this.configService.findByKey('single_amount');
    //   if (single) {
    //     betData.winning_amount =
    //       betData.amount_per_paana * +single.config_value;
    //     betData.is_claimed = true;
    //     customer.points = customer.points + betData.winning_amount;
    //     const customerData: any = await manager.save(customer).catch(e => {
    //       fromShared.compose(fromShared.operationFailed);
    //     });
    //   } else {
    //     throw fromShared.compose('Not a winner');

    //   }
    // }

    // if (betData.game_id === fromShared.GAMES.SINGLE) {

    //       const cTxn = new CustomerTransaction();
    //       cTxn.particulars = `You Won ${bazaarInitials} ${game.game_name} ${betData.selected_paana}`;
    //       cTxn.cust_id = customer.cust_id;
    //       cTxn.credit_amount = betData.winning_amount;
    //       cTxn.final_amount = customer.points;

    //       let adminLedger: AdminLedger;
    //       const existingAdminLedger = await manager.findOne(AdminLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //         },
    //       });

    //       const prevAdmin = await manager.findOne(AdminLedger, {
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAdmin) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingAdminLedger) {
    //         adminLedger = existingAdminLedger;
    //         adminLedger.cashed_amount = this.toF(
    //           +adminLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         adminLedger.ledger_before_payment = this.toF(
    //           +adminLedger.ledger_before_payment - betData.winning_amount,
    //         );
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       } else {
    //         adminLedger = new AdminLedger();
    //         adminLedger.ledger_date = bazaarDate;
    //         adminLedger.booking_amount = 0;
    //         adminLedger.commission_amount = 0;
    //         adminLedger.cashed_amount = +betData.winning_amount;
    //         adminLedger.calculated_ledger = 0;
    //         adminLedger.ledger_before_payment = this.toF(
    //           +prevAdmin.ledger_after_payment - +betData.winning_amount,
    //         );
    //         adminLedger.last_day_remaining_ledger = +prevAdmin.ledger_after_payment;
    //         adminLedger.ledger_after_payment =
    //         adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       }

    //       await manager.save(adminLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       await manager.save(cTxn).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });
    //       const betHistoryData: any = await manager.save(betData).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       betHistoryData.bazaar_name = bazaarDetails.bazaar_name;
    //       betHistoryData.game_name = game.game_name;
    //       betHistoryData.result = `${result.result_paana}-${result.result_single_value}`;

    //       betHistoryData.updated_points = customerData.points;

    //       return betHistoryData;
    //     } else {
    //       throw fromShared.compose('Cannot find configuration value');
    //     }
    //   } else {
    //   }
    // }

    // if (

    // ) {
    //   if (betData.game_id === fromShared.GAMES.CHART) {
    //     const chartResults = result.chart_combinations.filter(
    //       e => e.chart_name === betData.selected_paana,
    //     );
    //     if (!chartResults.length) {
    //       throw 'Not a winner';
    //     }
    //   }

    //   if (betData.game_id === fromShared.GAMES.COMMON) {
    //     const data = result.result_paana
    //       .split('')
    //       .some(c => betData.selected_paana.includes(c));

    //     if (!data) {
    //       throw 'Not a winner';
    //     }

    //     if (result.result_type !== betData.paana_type) {
    //       throw 'Not a winner';
    //     }
    //   }

    //   if (betData.game_id === fromShared.GAMES.PAANA) {
    //     if (result.result_paana !== betData.selected_paana) {
    //       throw 'Not a winner';
    //     }
    //   }

    //   const conf = await this.configService.findByKey(result.result_type);
    //   if (conf) {
    //     betData.winning_amount = betData.amount_per_paana * +conf.config_value;
    //     betData.is_claimed = true;
    //     customer.points = customer.points + betData.winning_amount;
    //     const customerData: any = await manager.save(customer).catch(e => {
    //       fromShared.compose(fromShared.operationFailed);
    //     });

    //     let adminLedger: AdminLedger;
    //     const existingAdminLedger = await manager.findOne(AdminLedger, {
    //       where: {
    //         ledger_date: bazaarDate,
    //       },
    //     });

    //     const prevAdmin = await manager.findOne(AdminLedger, {

    //       order: {
    //         created_at: 'DESC',
    //       },
    //     });

    //     if (!prevAdmin) {
    //       throw fromShared.compose('Admin Entry not found');
    //     }

    //     if (existingAdminLedger) {
    //       adminLedger = existingAdminLedger;

    //       adminLedger.cashed_amount = this.toF(
    //         +adminLedger.cashed_amount + +betData.winning_amount,
    //       );
    //       adminLedger.ledger_before_payment = this.toF(
    //         +adminLedger.ledger_before_payment - betData.winning_amount,
    //       );
    //       adminLedger.ledger_after_payment =
    //       adminLedger.ledger_before_payment;
    //       adminLedger.settled_difference = this.toF(
    //         this.c2N(adminLedger.calculated_ledger) -
    //           this.c2N(adminLedger.cashed_amount),
    //       );
    //     } else {
    //       adminLedger = new AdminLedger();
    //       adminLedger.ledger_date = bazaarDate;
    //       adminLedger.booking_amount = 0;
    //       adminLedger.commission_amount = 0;
    //       adminLedger.cashed_amount = +betData.winning_amount;
    //       adminLedger.calculated_ledger = 0;
    //       adminLedger.ledger_before_payment = this.toF(
    //         +prevAdmin.ledger_after_payment - +betData.winning_amount,
    //       );
    //       adminLedger.last_day_remaining_ledger = +prevAdmin.ledger_after_payment;
    //       adminLedger.ledger_after_payment =
    //       adminLedger.ledger_before_payment;
    //       adminLedger.settled_difference = this.toF(
    //         this.c2N(adminLedger.calculated_ledger) -
    //           this.c2N(adminLedger.cashed_amount),
    //       );
    //     }

    //     await manager.save(adminLedger).catch(e => {
    //       throw fromShared.compose(fromShared.operationFailed);
    //     });

    //     const cTxn = new CustomerTransaction();
    //     cTxn.particulars = `You Won ${bazaarInitials} ${game.game_name} ${betData.selected_paana}`;
    //     cTxn.cust_id = customer.cust_id;
    //     cTxn.credit_amount = betData.winning_amount;
    //     cTxn.final_amount = customer.points;

    //     await manager.save(cTxn).catch(e => {
    //       throw fromShared.compose(fromShared.operationFailed);
    //     });
    //     const betHistoryData: any = await manager.save(betData).catch(e => {
    //       fromShared.compose(fromShared.operationFailed);
    //     });

    //     betHistoryData.bazaar_name = bazaarDetails.bazaar_name;
    //     betHistoryData.game_name = game.game_name;
    //     betHistoryData.result = `${result.result_paana}-${result.result_single_value}`;

    //     betHistoryData.updated_points = customerData.points;

    //     return betHistoryData;
    //   } else {
    //     throw fromShared.compose('Cannot find configuration value');
    //   }
    // }

    // if (betData.game_id === fromShared.GAMES.CP) {
    //   const cpResults = result.cp_combinations.filter(
    //     e => e.paana_combination === betData.selected_paana,
    //   );
    //   if (cpResults.length) {
    //     const conf = await this.configService.findByKey(result.result_type);
    //     if (conf) {
    //       betData.winning_amount =
    //         betData.amount_per_paana * +conf.config_value;
    //       betData.is_claimed = true;
    //       customer.points = customer.points + betData.winning_amount;
    //       const customerData: any = await manager.save(customer).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       let retailerLedger: RetailerLedger;
    //       const existingRetailer = await manager.findOne(RetailerLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: customer.admin_id,
    //         },
    //       });

    //       const prevRetailer = await manager.findOne(RetailerLedger, {
    //         where: {
    //           admin_id: customer.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevRetailer) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingRetailer) {
    //         retailerLedger = existingRetailer;

    //         retailerLedger.cashed_amount = this.toF(
    //           +retailerLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         retailerLedger.ledger_before_payment = this.toF(
    //           +retailerLedger.ledger_before_payment - betData.winning_amount,
    //         );
    //         retailerLedger.ledger_after_payment =
    //           retailerLedger.ledger_before_payment;
    //         retailerLedger.settled_difference = this.toF(
    //           this.c2N(retailerLedger.calculated_ledger) -
    //             this.c2N(retailerLedger.cashed_amount),
    //         );
    //       } else {
    //         retailerLedger = new RetailerLedger();
    //         retailerLedger.ledger_date = bazaarDate;
    //         retailerLedger.admin_id = customer.admin_id;
    //         retailerLedger.booking_amount = 0;
    //         retailerLedger.commission_amount = 0;
    //         retailerLedger.cashed_amount = +betData.winning_amount;
    //         retailerLedger.calculated_ledger = 0;
    //         retailerLedger.ledger_before_payment = this.toF(
    //           +prevRetailer.ledger_after_payment - +betData.winning_amount,
    //         );
    //         retailerLedger.last_day_remaining_ledger = +prevRetailer.ledger_after_payment;
    //         retailerLedger.ledger_after_payment =
    //           retailerLedger.ledger_before_payment;
    //         retailerLedger.settled_difference = this.toF(
    //           this.c2N(retailerLedger.calculated_ledger) -
    //             this.c2N(retailerLedger.cashed_amount),
    //         );
    //       }

    //       await manager.save(retailerLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       let agentLedger: AgentLedger;
    //       const existingAgent = await manager.findOne(AgentLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: agent.admin_id,
    //         },
    //       });

    //       const prevAgent = await manager.findOne(AgentLedger, {
    //         where: {
    //           admin_id: agent.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAgent) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingAgent) {
    //         agentLedger = existingAgent;
    //         agentLedger.cashed_amount = this.toF(
    //           +agentLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         agentLedger.ledger_before_payment = this.toF(
    //           +agentLedger.ledger_before_payment - +betData.winning_amount,
    //         );
    //         agentLedger.ledger_after_payment =
    //           agentLedger.ledger_before_payment;
    //         agentLedger.settled_difference = this.toF(
    //           this.c2N(agentLedger.calculated_ledger) -
    //             this.c2N(agentLedger.cashed_amount),
    //         );
    //       } else {
    //         agentLedger = new AgentLedger();
    //         agentLedger.ledger_date = bazaarDate;
    //         agentLedger.admin_id = agent.admin_id;
    //         agentLedger.booking_amount = 0;
    //         agentLedger.commission_amount = 0;
    //         agentLedger.cashed_amount = +betData.winning_amount;
    //         agentLedger.calculated_ledger = 0;
    //         agentLedger.ledger_before_payment = this.toF(
    //           +prevAgent.ledger_after_payment - +betData.winning_amount,
    //         );
    //         agentLedger.last_day_remaining_ledger = +prevAgent.ledger_after_payment;
    //         agentLedger.ledger_after_payment =
    //           agentLedger.ledger_before_payment;
    //         agentLedger.settled_difference = this.toF(
    //           this.c2N(agentLedger.calculated_ledger) -
    //             this.c2N(agentLedger.cashed_amount),
    //         );
    //       }
    //       await manager.save(agentLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       let adminLedger: AdminLedger;
    //       const existingAdmin = await manager.findOne(AdminLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: admin.admin_id,
    //         },
    //       });

    //       const prevAdmin = await manager.findOne(AdminLedger, {
    //         where: {
    //           admin_id: admin.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAdmin) {
    //         throw fromShared.compose('Admin Entry not found');
    //       }

    //       if (existingAdmin) {
    //         adminLedger = existingAdmin;
    //         adminLedger.cashed_amount = this.toF(
    //           +adminLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         adminLedger.ledger_before_payment = this.toF(
    //           +adminLedger.ledger_before_payment - +betData.winning_amount,
    //         );
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       } else {
    //         adminLedger = new AdminLedger();
    //         adminLedger.ledger_date = bazaarDate;
    //         adminLedger.admin_id = admin.admin_id;
    //         adminLedger.booking_amount = 0;
    //         adminLedger.commission_amount = 0;
    //         adminLedger.cashed_amount = +betData.winning_amount;
    //         adminLedger.calculated_ledger = 0;
    //         adminLedger.ledger_before_payment = this.toF(
    //           +prevAdmin.ledger_after_payment - +betData.winning_amount,
    //         );
    //         adminLedger.last_day_remaining_ledger = +prevAdmin.ledger_after_payment;
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       }
    //       await manager.save(adminLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       const cTxn = new CustomerTransaction();
    //       cTxn.particulars = `You Won ${bazaarInitials} ${game.game_name} ${betData.selected_paana}`;
    //       cTxn.cust_id = customer.cust_id;
    //       cTxn.credit_amount = betData.winning_amount;
    //       cTxn.final_amount = customer.points;

    //       await manager.save(cTxn).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });
    //       const betHistoryData: any = await manager.save(betData).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       betHistoryData.bazaar_name = bazaarDetails.bazaar_name;
    //       betHistoryData.game_name = game.game_name;
    //       betHistoryData.result = `${result.result_paana}-${result.result_single_value}`;
    //       betHistoryData.updated_points = customerData.points;

    //       return betHistoryData;
    //     } else {
    //       throw fromShared.compose('Cannot find configuration value');
    //     }
    //   } else {
    //     throw fromShared.compose('Not a winner');
    //   }
    // }

    // if (betData.game_id === fromShared.GAMES.MOTOR) {
    //   if (
    //     result.result_paana
    //       .split('')
    //       .every(c => betData.selected_paana.includes(c))
    //   ) {
    //     const conf = await this.configService.findByKey(result.result_type);
    //     if (conf) {
    //       betData.winning_amount =
    //         betData.amount_per_paana * +conf.config_value;
    //       betData.is_claimed = true;
    //       customer.points = customer.points + betData.winning_amount;
    //       const customerData: any = await manager.save(customer).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       let retailerLedger: RetailerLedger;
    //       const existingRetailer = await manager.findOne(RetailerLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: customer.admin_id,
    //         },
    //       });

    //       const prevRetailer = await manager.findOne(RetailerLedger, {
    //         where: {
    //           admin_id: customer.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevRetailer) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingRetailer) {
    //         retailerLedger = existingRetailer;

    //         retailerLedger.cashed_amount = this.toF(
    //           +retailerLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         retailerLedger.ledger_before_payment = this.toF(
    //           +retailerLedger.ledger_before_payment - betData.winning_amount,
    //         );
    //         retailerLedger.ledger_after_payment =
    //           retailerLedger.ledger_before_payment;
    //         retailerLedger.settled_difference = this.toF(
    //           this.c2N(retailerLedger.calculated_ledger) -
    //             this.c2N(retailerLedger.cashed_amount),
    //         );
    //       } else {
    //         retailerLedger = new RetailerLedger();
    //         retailerLedger.ledger_date = bazaarDate;
    //         retailerLedger.admin_id = customer.admin_id;
    //         retailerLedger.booking_amount = 0;
    //         retailerLedger.commission_amount = 0;
    //         retailerLedger.cashed_amount = +betData.winning_amount;
    //         retailerLedger.calculated_ledger = 0;
    //         retailerLedger.ledger_before_payment = this.toF(
    //           +prevRetailer.ledger_after_payment - +betData.winning_amount,
    //         );
    //         retailerLedger.last_day_remaining_ledger = +prevRetailer.ledger_after_payment;
    //         retailerLedger.ledger_after_payment =
    //           retailerLedger.ledger_before_payment;
    //         retailerLedger.settled_difference = this.toF(
    //           this.c2N(retailerLedger.calculated_ledger) -
    //             this.c2N(retailerLedger.cashed_amount),
    //         );
    //       }

    //       await manager.save(retailerLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       let agentLedger: AgentLedger;
    //       const existingAgent = await manager.findOne(AgentLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: agent.admin_id,
    //         },
    //       });

    //       const prevAgent = await manager.findOne(AgentLedger, {
    //         where: {
    //           admin_id: agent.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAgent) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingAgent) {
    //         agentLedger = existingAgent;
    //         agentLedger.cashed_amount = this.toF(
    //           +agentLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         agentLedger.ledger_before_payment = this.toF(
    //           +agentLedger.ledger_before_payment - +betData.winning_amount,
    //         );
    //         agentLedger.ledger_after_payment =
    //           agentLedger.ledger_before_payment;
    //         agentLedger.settled_difference = this.toF(
    //           this.c2N(agentLedger.calculated_ledger) -
    //             this.c2N(agentLedger.cashed_amount),
    //         );
    //       } else {
    //         agentLedger = new AgentLedger();
    //         agentLedger.ledger_date = bazaarDate;
    //         agentLedger.admin_id = agent.admin_id;
    //         agentLedger.booking_amount = 0;
    //         agentLedger.commission_amount = 0;
    //         agentLedger.cashed_amount = +betData.winning_amount;
    //         agentLedger.calculated_ledger = 0;
    //         agentLedger.ledger_before_payment = this.toF(
    //           +prevAgent.ledger_after_payment - +betData.winning_amount,
    //         );
    //         agentLedger.last_day_remaining_ledger = +prevAgent.ledger_after_payment;
    //         agentLedger.ledger_after_payment =
    //           agentLedger.ledger_before_payment;
    //         agentLedger.settled_difference = this.toF(
    //           this.c2N(agentLedger.calculated_ledger) -
    //             this.c2N(agentLedger.cashed_amount),
    //         );
    //       }
    //       await manager.save(agentLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       let adminLedger: AdminLedger;
    //       const existingAdmin = await manager.findOne(AdminLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: admin.admin_id,
    //         },
    //       });

    //       const prevAdmin = await manager.findOne(AdminLedger, {
    //         where: {
    //           admin_id: admin.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAdmin) {
    //         throw fromShared.compose('Admin Entry not found');
    //       }

    //       if (existingAdmin) {
    //         adminLedger = existingAdmin;
    //         adminLedger.cashed_amount = this.toF(
    //           +adminLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         adminLedger.ledger_before_payment = this.toF(
    //           +adminLedger.ledger_before_payment - +betData.winning_amount,
    //         );
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       } else {
    //         adminLedger = new AdminLedger();
    //         adminLedger.ledger_date = bazaarDate;
    //         adminLedger.admin_id = admin.admin_id;
    //         adminLedger.booking_amount = 0;
    //         adminLedger.commission_amount = 0;
    //         adminLedger.cashed_amount = +betData.winning_amount;
    //         adminLedger.calculated_ledger = 0;
    //         adminLedger.ledger_before_payment = this.toF(
    //           +prevAdmin.ledger_after_payment - +betData.winning_amount,
    //         );
    //         adminLedger.last_day_remaining_ledger = +prevAdmin.ledger_after_payment;
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       }
    //       await manager.save(adminLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       const cTxn = new CustomerTransaction();
    //       cTxn.particulars = `You Won ${bazaarInitials} ${game.game_name} ${betData.selected_paana}`;
    //       cTxn.cust_id = customer.cust_id;
    //       cTxn.credit_amount = betData.winning_amount;
    //       cTxn.final_amount = customer.points;

    //       await manager.save(cTxn).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });
    //       const betHistoryData: any = await manager.save(betData).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       betHistoryData.bazaar_name = bazaarDetails.bazaar_name;
    //       betHistoryData.game_name = game.game_name;
    //       betHistoryData.result = `${result.result_paana}-${result.result_single_value}`;
    //       betHistoryData.updated_points = customerData.points;

    //       return betHistoryData;
    //     } else {
    //       throw fromShared.compose('Cannot find configuration value');
    //     }
    //   } else {
    //     throw fromShared.compose('Not a winner');
    //   }
    // }

    // if (betData.game_id === fromShared.GAMES.BRACKETS) {
    //   const result = await this.resultRepository
    //     .findOneOrFail({
    //       where: {
    //         game_date: betData.game_date,
    //         bazaar_id: fromShared.getInverse(betData.bazaar_id),
    //       },
    //     })
    //     .catch(e => {
    //       throw fromShared.compose('Cannot found result');
    //     });

    //   if (result.bracket_result === betData.selected_paana) {
    //     const conf = await this.configService.findByKey('bracket_amount');
    //     if (conf) {
    //       betData.winning_amount =
    //         betData.amount_per_paana * +conf.config_value;
    //       betData.is_claimed = true;
    //       customer.points = customer.points + betData.winning_amount;
    //       const customerData: any = await manager.save(customer).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       let retailerLedger: RetailerLedger;
    //       const existingRetailer = await manager.findOne(RetailerLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: customer.admin_id,
    //         },
    //       });

    //       const prevRetailer = await manager.findOne(RetailerLedger, {
    //         where: {
    //           admin_id: customer.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevRetailer) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingRetailer) {
    //         retailerLedger = existingRetailer;

    //         retailerLedger.cashed_amount = this.toF(
    //           +retailerLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         retailerLedger.ledger_before_payment = this.toF(
    //           +retailerLedger.ledger_before_payment - betData.winning_amount,
    //         );
    //         retailerLedger.ledger_after_payment =
    //           retailerLedger.ledger_before_payment;
    //       } else {
    //         retailerLedger = new RetailerLedger();
    //         retailerLedger.ledger_date = bazaarDate;
    //         retailerLedger.admin_id = customer.admin_id;
    //         retailerLedger.booking_amount = 0;
    //         retailerLedger.commission_amount = 0;
    //         retailerLedger.cashed_amount = +betData.winning_amount;
    //         retailerLedger.calculated_ledger = 0;
    //         retailerLedger.ledger_before_payment = this.toF(
    //           +prevRetailer.ledger_after_payment - +betData.winning_amount,
    //         );
    //         retailerLedger.last_day_remaining_ledger = +prevRetailer.ledger_after_payment;
    //         retailerLedger.ledger_after_payment =
    //           retailerLedger.ledger_before_payment;
    //         retailerLedger.settled_difference = this.toF(
    //           this.c2N(retailerLedger.calculated_ledger) -
    //             this.c2N(retailerLedger.cashed_amount),
    //         );
    //       }

    //       await manager.save(retailerLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       let agentLedger: AgentLedger;
    //       const existingAgent = await manager.findOne(AgentLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: agent.admin_id,
    //         },
    //       });

    //       const prevAgent = await manager.findOne(AgentLedger, {
    //         where: {
    //           admin_id: agent.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAgent) {
    //         throw fromShared.compose('Retailer Entry not found');
    //       }

    //       if (existingAgent) {
    //         agentLedger = existingAgent;
    //         agentLedger.cashed_amount = this.toF(
    //           +agentLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         agentLedger.ledger_before_payment = this.toF(
    //           +agentLedger.ledger_before_payment - +betData.winning_amount,
    //         );
    //         agentLedger.ledger_after_payment =
    //           agentLedger.ledger_before_payment;
    //       } else {
    //         agentLedger = new AgentLedger();
    //         agentLedger.ledger_date = bazaarDate;
    //         agentLedger.admin_id = agent.admin_id;
    //         agentLedger.booking_amount = 0;
    //         agentLedger.commission_amount = 0;
    //         agentLedger.cashed_amount = +betData.winning_amount;
    //         agentLedger.calculated_ledger = 0;
    //         agentLedger.ledger_before_payment = this.toF(
    //           +prevAgent.ledger_after_payment - +betData.winning_amount,
    //         );
    //         agentLedger.last_day_remaining_ledger = +prevAgent.ledger_after_payment;
    //         agentLedger.ledger_after_payment =
    //           agentLedger.ledger_before_payment;
    //         agentLedger.settled_difference = this.toF(
    //           this.c2N(agentLedger.calculated_ledger) -
    //             this.c2N(agentLedger.cashed_amount),
    //         );
    //       }
    //       await manager.save(agentLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       let adminLedger: AdminLedger;
    //       const existingAdmin = await manager.findOne(AdminLedger, {
    //         where: {
    //           ledger_date: bazaarDate,
    //           admin_id: admin.admin_id,
    //         },
    //       });

    //       const prevAdmin = await manager.findOne(AdminLedger, {
    //         where: {
    //           admin_id: admin.admin_id,
    //         },
    //         order: {
    //           created_at: 'DESC',
    //         },
    //       });

    //       if (!prevAdmin) {
    //         throw fromShared.compose('Admin Entry not found');
    //       }

    //       if (existingAdmin) {
    //         adminLedger = existingAdmin;
    //         adminLedger.cashed_amount = this.toF(
    //           +adminLedger.cashed_amount + +betData.winning_amount,
    //         );
    //         adminLedger.ledger_before_payment = this.toF(
    //           +adminLedger.ledger_before_payment - +betData.winning_amount,
    //         );
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //       } else {
    //         adminLedger = new AdminLedger();
    //         adminLedger.ledger_date = bazaarDate;
    //         adminLedger.admin_id = admin.admin_id;
    //         adminLedger.booking_amount = 0;
    //         adminLedger.commission_amount = 0;
    //         adminLedger.cashed_amount = +betData.winning_amount;
    //         adminLedger.calculated_ledger = 0;
    //         adminLedger.ledger_before_payment = this.toF(
    //           +prevAdmin.ledger_after_payment - +betData.winning_amount,
    //         );
    //         adminLedger.last_day_remaining_ledger = +prevAdmin.ledger_after_payment;
    //         adminLedger.ledger_after_payment =
    //           adminLedger.ledger_before_payment;
    //         adminLedger.settled_difference = this.toF(
    //           this.c2N(adminLedger.calculated_ledger) -
    //             this.c2N(adminLedger.cashed_amount),
    //         );
    //       }
    //       await manager.save(adminLedger).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });

    //       const cTxn = new CustomerTransaction();
    //       cTxn.particulars = `You Won ${bazaarInitials} ${game.game_name} ${betData.selected_paana}`;
    //       cTxn.cust_id = customer.cust_id;
    //       cTxn.credit_amount = betData.winning_amount;
    //       cTxn.final_amount = customer.points;

    //       await manager.save(cTxn).catch(e => {
    //         throw fromShared.compose(fromShared.operationFailed);
    //       });
    //       const betHistoryData: any = await manager.save(betData).catch(e => {
    //         fromShared.compose(fromShared.operationFailed);
    //       });

    //       betHistoryData.bazaar_name = bazaarDetails.bazaar_name;
    //       betHistoryData.game_name = game.game_name;
    //       betHistoryData.result = `${result.result_paana}-${result.result_single_value}`;

    //       betHistoryData.updated_points = customerData.points;

    //       return betHistoryData;
    //     } else {
    //       throw fromShared.compose('Cannot find configuration value');
    //     }
    //   } else {
    //     throw fromShared.compose('Not a winner');
    //   }
    // }
  }

  async getAnalysisTotal(req: BetAnalysisDTO) {
    const total = await this.betHistoryRepository
      .createQueryBuilder()
      .select('SUM(total_amount)')
      .where('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .andWhere('status = :betStatus', {
        betStatus: true,
      })
      .getRawOne();

    const singleData = await this.betHistoryRepository
      .createQueryBuilder()
      .groupBy('bazaar_id')
      .select('SUM(total_amount)')
      .where('game_id = :gameId', {
        gameId: fromShared.GAMES.SINGLE,
      })
      .andWhere('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .andWhere('status = :betStatus', {
        betStatus: true,
      })
      .getRawOne();

    const paanas = await this.adminAnalysisRepository
      .createQueryBuilder()
      .select('SUM(amount)')
      .where('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .getRawOne();

    const brackets = await this.betHistoryRepository
      .createQueryBuilder()
      .groupBy('bazaar_id')
      .select('SUM(total_amount)')
      .where('game_id = :gameId', {
        gameId: fromShared.GAMES.BRACKETS,
      })
      .andWhere('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .andWhere('status = :betStatus', {
        betStatus: true,
      })
      .getRawOne();

    return {
      total: total && total.sum ? total.sum : null,
      single: singleData && singleData.sum ? singleData.sum : null,
      paanas: paanas && paanas.sum ? paanas.sum : null,
      brackets: brackets && brackets.sum ? brackets.sum : null,
    };
  }

  async getAnalysis(req: BetAnalysisDTO, gameType) {
    const singleData = await this.betHistoryRepository
      .createQueryBuilder()
      .groupBy('bazaar_id')
      .addGroupBy('selected_paana')
      .select('selected_paana')
      .addSelect('SUM(total_amount)', 'total_paana_amount')
      .orderBy('total_paana_amount', 'DESC')
      .where('game_id = :gameId', {
        gameId: fromShared.GAMES.SINGLE,
      })
      .andWhere('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .andWhere('status = :betStatus', {
        betStatus: true,
      })
      .getRawMany();

    const paanas = await this.adminAnalysisRepository
      .createQueryBuilder()
      .select('paana_no', 'selected_paana')
      .addSelect('amount', 'total_paana_amount')
      .orderBy('amount', 'DESC')
      .where('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .getRawMany();

    const brackets = await this.betHistoryRepository
      .createQueryBuilder()
      .groupBy('bazaar_id')
      .addGroupBy('selected_paana')
      .select('selected_paana')
      .addSelect('SUM(total_amount)', 'total_paana_amount')
      .orderBy('total_paana_amount', 'DESC')
      .where('game_id = :gameId', {
        gameId: fromShared.GAMES.BRACKETS,
      })
      .andWhere('bazaar_id = :bazaarId', {
        bazaarId: req.bazaar_id,
      })
      .andWhere('game_date = :gameDate', {
        gameDate: req.game_date,
      })
      .andWhere('status = :betStatus', {
        betStatus: true,
      })
      .getRawMany();

    if (gameType === 'single') {
      return singleData;
    }

    if (gameType === 'paana') {
      return paanas;
    }

    if (gameType === 'brackets') {
      return brackets;
    }
  }
}
