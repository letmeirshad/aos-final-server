import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  TransactionManager,
  EntityManager,
  Transaction,
  In,
} from 'typeorm';
import { Result } from './results.entity';
import { ResultDTO } from './results.dto';
import * as fromShared from '../shared';
import { Bazaar } from '../bazaar/bazaar.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import { BetHistory } from '../bet-history/bet-history.entity';
import { Paana } from '../paana/paana.entity';
import { CpResult } from '../cp-result/cp-result.entity';
import { ChartResult } from '../chart-result/chart-result.entity';

import { plainToClass } from 'class-transformer';
import { Admin } from '../admin/admin.entity';
import { BazaarResultHistory } from '../bazaar-result-history/bazaar-result-history.entity';
import { Chart } from '../chart/chart.entity';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(Bazaar)
    private readonly bazaarRepository: Repository<Bazaar>,
    @InjectRepository(Result)
    private readonly resultRepository: Repository<Result>,
    @InjectRepository(BetHistory)
    private readonly betHistoryRepository: Repository<BetHistory>,
    @InjectRepository(Paana)
    private readonly paanaRepository: Repository<Paana>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Chart)
    private readonly chartRepository: Repository<Chart>,
    @InjectRepository(BazaarResultHistory)
    private readonly bazaarResultRepository: Repository<BazaarResultHistory>,
    @Inject(BazaarService)
    private readonly bazaarService: BazaarService,
  ) {}

  @Transaction()
  async save(result: ResultDTO, @TransactionManager() manager: EntityManager) {
    const admin = await this.adminRepository
      .findOneOrFail({
        where: {
          admin_id: result.admin_id,
          status: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find user');
      });

    const findExisting = await this.resultRepository.findOne({
      where: {
        bazaar_id: result.bazaar_id,
        game_date: result.game_date,
      },
    });
    const saveResult = findExisting ? findExisting : new Result();

    if (findExisting) {
      if (findExisting.result_paana && result.result_paana) {
        throw fromShared.compose('Cannot update result');
      }

      if (
        findExisting.final &&
        result.final &&
        findExisting.final !== result.final
      ) {
        throw fromShared.compose('Cannot update final');
      }
    } else {
      if (result.final) {
        let bazaar_id = fromShared.getInverse(result.bazaar_id);
        if (!bazaar_id) {
          throw fromShared.compose('Bazaar not found');
        }

        const bazaar = await this.bazaarRepository
          .findOneOrFail({
            where: {
              bazaar_id: bazaar_id,
            },
          })
          .catch(e => {
            throw fromShared.compose("Bazaar doesn't exists");
          });
        const findExisting = await this.resultRepository.findOne({
          where: {
            bazaar_id: result.bazaar_id,
            game_date: result.game_date,
          },
        });

        let newResult = findExisting ? findExisting : new Result();
        newResult.bazaar = bazaar;
        newResult.game_date = result.game_date;
        newResult.final = result.final;
        await manager.save(newResult);
      }
    }

    const bazaar = await this.bazaarRepository
      .findOneOrFail({
        where: {
          bazaar_id: result.bazaar_id,
        },
      })
      .catch(e => {
        throw fromShared.compose("Bazaar doesn't exists");
      });

    const bazaarDateTiming = await this.bazaarService.getBazaarDetails(
      bazaar.bazaar_id,
      result.game_date,
    );

    if (!bazaarDateTiming.booking_date) {
      throw fromShared.compose('Invalid Date');
    }

    if (result.result_paana && bazaarDateTiming.remaining_time) {
      throw fromShared.compose(
        `You can enter result after ${fromShared.Time.getTime24(
          bazaar.timing,
        )}`,
      );
    }
    if (result.result_paana) {
      const paanaDetails = await this.paanaRepository
        .findOneOrFail({
          where: {
            paana_no: result.result_paana,
          },
          relations: [
            'single_result',
            'cp_combinations',
            'cp_combinations.cp_paana',
          ],
        })
        .catch(e => {
          throw fromShared.compose('Invalid Result');
        });
      saveResult.result_single_value = paanaDetails.single_result.single_value;
      saveResult.result_type = paanaDetails.paana_type;
    }

    saveResult.bazaar = bazaar;
    saveResult.game_date = result.game_date;
    saveResult.result_paana = result.result_paana;
    saveResult.final = result.final;

    const newResultData = await manager.save(saveResult).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    if (result.result_paana) {
      const paanaDetails = await this.paanaRepository
        .findOneOrFail({
          where: {
            paana_no: result.result_paana,
          },
          relations: [
            'single_result',
            'cp_combinations',
            'cp_combinations.cp_paana',
          ],
        })
        .catch(e => {
          throw fromShared.compose('Invalid Result');
        });
      const cpCombs = paanaDetails.cp_combinations.map(
        e => e.cp_paana.cp_paana_no,
      );

      const combosMap = cpCombs.map(e => {
        return {
          result_id: newResultData.result_id,
          paana_no: paanaDetails.paana_no,
          paana_combination: e,
        };
      });

      const chartResultDetails = await this.chartRepository.find({
        where: {
          paana_no: result.result_paana,
        },
      });

      if (chartResultDetails.length) {
        const chartCombos = chartResultDetails.map(e => {
          return {
            result_id: newResultData.result_id,
            paana_no: paanaDetails.paana_no,
            chart_name: e.chart_name,
          };
        });

        await manager.save(plainToClass(ChartResult, chartCombos)).catch(e => {
          fromShared.compose(fromShared.operationFailed);
        });
      }

      await manager.save(plainToClass(CpResult, combosMap)).catch(e => {
        fromShared.compose(fromShared.operationFailed);
      });

      const bets = await this.betHistoryRepository.find({
        where: {
          game_date: newResultData.game_date,
          bazaar_id: newResultData.bazaar_id,
        },
        select: ['bet_id'],
      });
      const ids = bets.map(e => e.bet_id);
      if (ids.length) {
        await manager
          .update(BetHistory, ids, {
            is_result_declared: true,
            is_winner: false,
          })
          .catch(e => {
            throw fromShared.compose(fromShared.operationFailed);
          });
      }

      /// Check for Single Game
      const singleBets = await this.betHistoryRepository.find({
        where: {
          game_date: newResultData.game_date,
          bazaar_id: newResultData.bazaar_id,
          game_id: fromShared.GAMES.SINGLE,
          selected_paana: newResultData.result_single_value.toString(),
        },
        select: ['bet_id'],
      });
      const singleIds = singleBets.map(e => e.bet_id);
      if (singleIds.length) {
        await manager
          .update(BetHistory, singleIds, { is_winner: true, is_claimed: false })
          .catch(e => {
            throw fromShared.compose(fromShared.operationFailed);
          });
      }

      const paanaBets = await this.betHistoryRepository.find({
        where: {
          game_date: newResultData.game_date,
          bazaar_id: newResultData.bazaar_id,
          game_id: fromShared.GAMES.PAANA,
          selected_paana: newResultData.result_paana,
        },
        select: ['bet_id'],
      });
      const paanaIds = paanaBets.map(e => e.bet_id);
      if (paanaIds.length) {
        await manager
          .update(BetHistory, paanaIds, { is_winner: true, is_claimed: false })
          .catch(e => {
            throw fromShared.compose(fromShared.operationFailed);
          });
      }

      /// Check for CP Game
      const cpResults = await manager.find(CpResult, {
        where: {
          result_id: newResultData.result_id,
          paana_no: newResultData.result_paana,
        },
        select: ['paana_combination'],
      });

      const cpMapped = cpResults.map(e => e.paana_combination);

      const cpBets = await this.betHistoryRepository.find({
        where: {
          game_date: newResultData.game_date,
          bazaar_id: newResultData.bazaar_id,
          game_id: fromShared.GAMES.CP,
          selected_paana: In(cpMapped),
        },
        select: ['bet_id'],
      });
      const cpIds = cpBets.map(e => e.bet_id);
      if (cpIds.length) {
        await manager
          .update(BetHistory, cpIds, { is_winner: true, is_claimed: false })
          .catch(e => {
            throw fromShared.compose(fromShared.operationFailed);
          });
      }

      // Check for Chart Game

      const chartResults = await manager.find(ChartResult, {
        where: {
          result_id: newResultData.result_id,
          paana_no: newResultData.result_paana,
        },
        select: ['chart_name'],
      });

      if (chartResults.length) {
        const chartMapped = chartResults.map(e => e.chart_name);

        const chartBets = await this.betHistoryRepository.find({
          where: {
            game_date: newResultData.game_date,
            bazaar_id: newResultData.bazaar_id,
            game_id: fromShared.GAMES.CHART,
            selected_paana: In(chartMapped),
          },
          select: ['bet_id'],
        });

        const chartIds = chartBets.map(e => e.bet_id);

        if (chartIds.length) {
          await manager
            .update(BetHistory, chartIds, {
              is_winner: true,
              is_claimed: false,
            })
            .catch(e => {
              throw fromShared.compose(fromShared.operationFailed);
            });
        }
      }

      /// Check for Motor Game
      const motor = await this.betHistoryRepository.find({
        where: {
          game_date: newResultData.game_date,
          bazaar_id: newResultData.bazaar_id,
          game_id: fromShared.GAMES.MOTOR,
          paana_type: newResultData.result_type,
        },
      });

      const filteredMotor = motor.filter(e =>
        newResultData.result_paana
          .split('')
          .every(c => e.selected_paana.includes(c)),
      );

      const motorIds = filteredMotor.map(e => e.bet_id);
      if (motorIds.length) {
        await manager
          .update(BetHistory, motorIds, { is_winner: true, is_claimed: false })
          .catch(e => {
            throw fromShared.compose(fromShared.operationFailed);
          });
      }

      //Check Common Game
      const common = await this.betHistoryRepository.find({
        where: {
          game_date: newResultData.game_date,
          bazaar_id: newResultData.bazaar_id,
          game_id: fromShared.GAMES.COMMON,
          paana_type: newResultData.result_type,
        },
      });

      const filteredCommon = common.filter(e =>
        newResultData.result_paana
          .split('')
          .some(c => e.selected_paana.includes(c)),
      );

      const commonIds = filteredCommon.map(e => e.bet_id);
      if (commonIds.length) {
        await manager
          .update(BetHistory, commonIds, { is_winner: true, is_claimed: false })
          .catch(e => {
            throw fromShared.compose(fromShared.operationFailed);
          });
      }

      if (fromShared.isCloseBazaar(bazaar.bazaar_id)) {
        const results = await this.resultRepository
          .findOneOrFail({
            where: {
              bazaar_id: fromShared.getInverse(bazaar.bazaar_id),
              game_date: result.game_date,
            },
          })
          .catch(e => {
            throw fromShared.compose('Bazaar Not Found');
          });

        const resultString = result.final
          ? `=${result.final}=(${results.result_paana}-${results.result_single_value}${newResultData.result_single_value}-${newResultData.result_paana})`
          : `=(${results.result_paana}-${results.result_single_value}${newResultData.result_single_value}-${newResultData.result_paana})`;


        let key = fromShared.getBazaarCombo(bazaar.bazaar_id);
        let insertData;

        const exisitingBetHistory = await this.bazaarResultRepository.findOne({
          where: {
            result_date: result.game_date,
          },
        });


        if (exisitingBetHistory) {
          insertData = exisitingBetHistory;
        } else {
          insertData = {
            result_date: result.game_date,
          };
        }



        insertData[key] = resultString;
        await manager.save(BazaarResultHistory, insertData).catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });

        const bracketBets = await this.betHistoryRepository.find({
          where: {
            game_date: newResultData.game_date,
            bazaar_id: fromShared.getInverse(bazaar.bazaar_id),
            game_id: fromShared.GAMES.BRACKETS,
            selected_paana: `${results.result_single_value}${newResultData.result_single_value}`,
          },
          select: ['bet_id'],
        });
        const bracketIds = bracketBets.map(e => e.bet_id);
        if (bracketIds.length) {
          await manager
            .update(BetHistory, bracketIds, {
              is_winner: true,
              is_claimed: false,
            })
            .catch(e => {
              throw fromShared.compose(fromShared.operationFailed);
            });
          await manager
            .update(Result, newResultData.result_id, {
              bracket_result: `${results.result_single_value}${newResultData.result_single_value}`,
            })
            .catch(e => {
              throw fromShared.compose(fromShared.operationFailed);
            });
        }
      }
    }
  }

  async getBazaars() {
    const bazaarDetails = await this.bazaarService.findAll();
    const filteredBazaarDetails = bazaarDetails.filter(
      e => e.booking_date === fromShared.Time.getCurrentDate(),
    );
    const promise = filteredBazaarDetails.map(async (e: any) => {
      const resultDetails = await this.resultRepository.findOne({
        where: {
          game_date: e.booking_date,
          bazaar_id: e.bazaar_id,
        },
      });
      return { ...e, ...resultDetails };
    });

    return await Promise.all(promise);
  }

  async getResultTiming(bazzarId) {
    const bazaarDetail = await this.bazaarService.findTimeById(bazzarId);
    return bazaarDetail;
  }
}
