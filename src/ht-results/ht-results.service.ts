import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, Server } from 'typeorm';
import { HTResult } from './ht-results.entity';
import * as fromShared from '../shared';
import { HTBetHistory } from '../ht-bet-history/ht-bet-history.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { HTConfig } from '../ht-config/ht-config.entity';
import { HTFloater } from '../ht-floater/ht-floater.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import { Customer } from '../customer/customer.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { HTAdminLedger } from '../ht-admin-ledger/ht-admin-ledger.entity';
import { Admin } from '../admin/admin.entity';
import { HTSlotService } from '../ht-slot/ht-slot.service';
import { HTSlot } from '../ht-slot/ht-slot.entity';
import { SlotResultDTO } from './ht-results.dto';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
@Injectable()
@WebSocketGateway(+process.env.PORT)
export class HTResultService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(HTResult)
    private readonly resultRepository: Repository<HTResult>,
    @InjectRepository(HTBetHistory)
    private readonly betHistoryRepository: Repository<HTBetHistory>,
    @InjectRepository(HTConfig)
    private readonly configRepository: Repository<HTConfig>,
    @InjectRepository(HTFloater)
    private readonly floaterRepository: Repository<HTFloater>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomGame)
    private readonly customGameRepository: Repository<CustomGame>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectConnection() private connection: Connection,
    private schedulerRegistry: SchedulerRegistry,
    private slotService: HTSlotService,
  ) {}

  async onApplicationBootstrap() {
    await this.declareResults();
    const configList = await this.configRepository.find();
    if (configList.length) {
      await this.setCron();
    }
  }

  @WebSocketServer()
  server: Server;
  async save() {
    enum BetType {
      HEAD = 'H',
      TALE = 'T',
    }
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const configData = await this.configRepository.find();

      const floaterData = await this.floaterRepository.find();
      const floater = floaterData[0];
      const currentDate = fromShared.Time.getCurrentDate();

      if (!configData.length) {
        throw fromShared.compose('Cannot find config');
      }
      const existingSlots = await this.slotService.findAll();

      let slots: HTSlot[];
      if (!existingSlots.length) {
        slots = await this.slotService.create(currentDate);
      } else {
        slots = existingSlots;
      }

      const currentSlotData = await this.slotService.getCurrentSlot();

      const currentSlot = currentSlotData.slot_no;

      const findExisting = await this.resultRepository.find({
        where: {
          slot: currentSlot,
          game_date: currentDate,
        },
      });

      if (findExisting.length) {
        throw fromShared.compose('Already result declared');
      }

      const gameDetails = await this.customGameRepository
        .findOneOrFail({
          where: {
            game_id: fromShared.GAMES_CUST.HT,
            status: true,
          },
        })
        .catch(e => {
          throw fromShared.compose('Game Details not found');
        });

      const headBet = await this.betHistoryRepository.find({
        where: {
          bet_type: BetType.HEAD,
          game_date: currentDate,
          slot: currentSlot,
        },
      });

      const tailBet = await this.betHistoryRepository.find({
        where: {
          bet_type: BetType.TALE,
          game_date: currentDate,
          slot: currentSlot,
        },
      });

      let headAmount = 0;
      let tailAmount = 0;
      let totalAmount = 0;

      if (headBet.length) {
        headAmount = headBet.map(e => e.total_amount).reduce((a, b) => a + b);
      }

      if (tailBet.length) {
        tailAmount = tailBet.map(e => e.total_amount).reduce((a, b) => a + b);
      }

      totalAmount = headAmount + tailAmount;

      let largerBet = null;
      let smallerBet = null;
      if (headAmount > tailAmount) {
        largerBet = BetType.HEAD;
        smallerBet = BetType.TALE;
      } else {
        largerBet = BetType.TALE;
        smallerBet = BetType.HEAD;
      }

      let allwinners = null;
      const smallerBetAmount =
        smallerBet === BetType.HEAD ? headAmount : tailAmount;
      const largerBetAmount =
        largerBet === BetType.HEAD ? headAmount : tailAmount;

      const newResult = new HTResult();
      newResult.game_date = currentDate;
      newResult.slot = currentSlot;

      if (floater.status) {
        if (floater.floater < 0) {
          allwinners = await this.betHistoryRepository.find({
            where: {
              game_date: currentDate,
              slot: currentSlot,
              bet_type: smallerBet,
            },
          });
          newResult.bet_type = smallerBet;
          floater.floater =
            floater.floater + (totalAmount - smallerBetAmount * 2);
        } else {
          let floaterUpdated = largerBetAmount * 2 - totalAmount;
          let isExceedingLimit =
            floaterUpdated > 5000 && floaterUpdated > floater.floater
              ? true
              : false;
          allwinners = await this.betHistoryRepository.find({
            where: {
              game_date: currentDate,
              slot: currentSlot,
              bet_type: isExceedingLimit ? smallerBet : largerBet,
            },
          });
          newResult.bet_type = isExceedingLimit ? smallerBet : largerBet;
          floater.floater = isExceedingLimit
            ? floater.floater + (totalAmount - smallerBetAmount * 2)
            : floater.floater + (totalAmount - largerBetAmount * 2);
        }
      } else {
        allwinners = await this.betHistoryRepository.find({
          where: {
            game_date: currentDate,
            slot: currentSlot,
            bet_type: smallerBet,
          },
        });
        newResult.bet_type = smallerBet;
      }

      if (!headBet.length && !tailBet.length) {
        const random = Math.floor(Math.random() * 10) + 1;
        if (random % 2 === 0) {
          newResult.bet_type = BetType.HEAD;
        } else {
          newResult.bet_type = BetType.TALE;
        }
      }

      await queryRunner.manager.save(floater);
      await queryRunner.manager.save(newResult);

      if (slots[slots.length - 1].slot_no === currentSlot) {
        await this.slotService.create(fromShared.Time.getNextDate());
      }

    
      if (!headBet.length && !tailBet.length) {
        return;
      }

      const promiseCollection = allwinners.map(async e => {
        const customer = await this.customerRepository.findOne({
          where: {
            cust_id: e.cust_id,
          },
        });
        customer.points = customer.points + e.total_amount * 2;
        await queryRunner.manager.save(customer);

        const dTxn = new CustomerTransaction();
        dTxn.particulars = `You won ${gameDetails.game_name} ${newResult.bet_type}`;
        dTxn.cust_id = e.cust_id;
        dTxn.credit_amount = e.total_amount * 2;
        dTxn.final_amount = customer.points;

        await queryRunner.manager.save(dTxn);
        const betHistory = await this.betHistoryRepository.findOne({
          where: {
            bet_id: e.bet_id,
          },
        });

        betHistory.is_winner = true;
        betHistory.winning_amount = e.total_amount * 2;

        await queryRunner.manager.save(betHistory);

        let adminLedger: HTAdminLedger;
        const existingAdmin = await queryRunner.manager.findOne(HTAdminLedger, {
          where: {
            ledger_date: currentDate,
          },
        });

        const prevAdmin = await queryRunner.manager.findOne(HTAdminLedger, {
          order: {
            created_at: 'DESC',
          },
        });

        if (!prevAdmin) {
          throw fromShared.compose('Admin Entry not found');
        }

        adminLedger = existingAdmin;
        adminLedger.cashed_amount = this.toF(
          +adminLedger.cashed_amount + betHistory.winning_amount,
        );
        adminLedger.calculated_ledger = this.toF(
          this.c2N(adminLedger.booking_amount) -
            this.c2N(adminLedger.cashed_amount),
        );

        adminLedger.ledger_before_payment = this.toF(
          +adminLedger.ledger_before_payment - betHistory.winning_amount,
        );

        adminLedger.ledger_after_payment = adminLedger.ledger_before_payment;

        await queryRunner.manager.save(adminLedger).catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });

        // let agentLedger: HTAgentLedger;
        // const existingAgent = await queryRunner.manager.findOne(HTAgentLedger, {
        //   where: {
        //     ledger_date: currentDate,
        //     admin_id: agent.admin_id,
        //   },
        // });

        // const prevAgent = await queryRunner.manager.findOne(HTAgentLedger, {
        //   where: {
        //     admin_id: agent.admin_id,
        //   },
        //   order: {
        //     created_at: 'DESC',
        //   },
        // });

        // if (!prevAgent) {
        //   throw fromShared.compose('Retailer Entry not found');
        // }

        // agentLedger = existingAgent;
        // agentLedger.cashed_amount = this.toF(
        //   +agentLedger.cashed_amount + +betHistory.winning_amount,
        // );
        // agentLedger.ledger_before_payment = this.toF(
        //   +agentLedger.ledger_before_payment - +betHistory.winning_amount,
        // );
        // agentLedger.calculated_ledger = this.toF(
        //   this.c2N(agentLedger.booking_amount) -
        //     this.c2N(agentLedger.cashed_amount),
        // );
        // agentLedger.ledger_after_payment = agentLedger.ledger_before_payment;
        // await queryRunner.manager.save(agentLedger).catch(e => {
        //   throw fromShared.compose(fromShared.operationFailed);
        // });
      });

      await Promise.all(promiseCollection);
      // this.server.emit('ht-results-done',{});
      await queryRunner.commitTransaction();
    } catch (e) {
      // this.server.emit('ht-results-error')
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async setCron() {
    const configList = await this.configRepository.find();
    if (!configList.length) {
      throw fromShared.compose('Configuration not found');
    }
    const config = configList[0];
    const calculateCRON = fromShared.Time.getCRONTiming(
      config.start_timing,
      config.end_timing,
      config.interval_minutes,
      config.close_before_seconds,
    );

    const cronString = `${calculateCRON.startSecond + 1} ${
      calculateCRON.startMinute
    }/${calculateCRON.interval} ${calculateCRON.startHour}-${
      calculateCRON.endHour
    } * * *`;
    const job = new CronJob(cronString, async () => {
      await this.save();
    });

    this.schedulerRegistry.addCronJob('ht-result-cron', job);
    job.start();
  }

  async declareResults() {}

  async findAll() {
    const results = await this.resultRepository
      .find({
        take: 10,
        // select: ['bet_type'],
        order: {
          created_at: 'DESC',
        },
      })
      .catch(e => {
        throw fromShared.compose('Cant find results');
      });


    return results;
  }

  async getSlotResult(data: SlotResultDTO) {
    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: data.cust_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find bet customer data');
      });
    if (!data.slot_no) {
      const result = await this.resultRepository
        .findOne({
          order: {
            created_at: 'DESC',
          },
        })
        .catch(e => {
          throw fromShared.compose('Cannot find result');
        });

      return {
        result: result.bet_type,
        updated_points: customer.points,
        winning_amount: 0,
      };
    }

    const bet = await this.betHistoryRepository.find({
      where: {
        slot: data.slot_no,
        cust_id: data.cust_id,
      },
    });

    if (!bet.length) {
      throw fromShared.compose('Cannot find bet data');
    }

    const result = await this.resultRepository
      .findOneOrFail({
        where: {
          slot: data.slot_no,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find result');
      });

    if (bet.length > 1) {
      const wonBet = bet.filter(e => e.is_winner && e.winning_amount);
      return {
        result: result.bet_type,
        updated_points: customer.points,
        winning_amount: wonBet[0].winning_amount,
      };
    } else {
      return {
        result: result.bet_type,
        updated_points: customer.points,
        winning_amount: bet[0].winning_amount,
      };
    }
  }

  async getAnalysis() {
    const currentSlotData = await this.slotService.getCurrentSlot();
    const allBets = await this.betHistoryRepository.find({
      where: {
        game_date: fromShared.Time.getCurrentDate(),
      },
    });

    const totalData = allBets.length ? allBets.map(e => e.total_amount) : null;
    const total = totalData
      ? totalData.length > 1
        ? totalData.reduce((a, b) => a + b)
        : totalData[0]
      : null;
    const wonData = allBets.length
      ? allBets.filter(bet => bet.is_winner === true).map(bet => bet.winning_amount)
      : null;
    const won = wonData
      ? wonData.length > 1
        ? wonData.reduce((a, b) => +a + +b)
        : wonData[0]
      : null;
    const currentHeadData = allBets.length
      ? allBets
          .filter(
            bet => bet.slot === currentSlotData.slot_no && bet.bet_type === 'H',
          )
          .map(e => e.total_amount)
      : null;
    const currentHead = currentHeadData
      ? currentHeadData.length > 1
        ? currentHeadData.reduce((a, b) => a + b)
        : currentHeadData[0]
      : null;
    const currentTaleData = allBets.length
      ? allBets
          .filter(
            bet => bet.slot === currentSlotData.slot_no && bet.bet_type === 'T',
          )
          .map(e => e.total_amount)
      : null;
    const currentTale = currentTaleData
      ? currentTaleData.length > 1
        ? currentTaleData.reduce((a, b) => a + b)
        : currentTaleData[0]
      : null;

    const date = fromShared.Time.getCurrentDate();

    return {
      total: total,
      won: won,
      current_head: currentHead,
      current_tale: currentTale,
      date: date,
    };
  }

  private toF(number: number) {
    return +number.toFixed(3);
  }

  private c2N(num: string | number) {
    return typeof num === 'number' ? num : +num;
  }
}
