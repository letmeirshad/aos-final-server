import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './game.entity';
import { GameAmountDTO, GameStatusDTO } from './game.dto';
import { DbVersion } from '../db-version/db-version.entity';
import { Amount } from '../amount/amount.entity';
import * as fromShared from './../shared';
import { Validator } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(DbVersion)
    private readonly dbversionRepository: Repository<DbVersion>,
    @InjectRepository(Amount)
    private readonly amountRepository: Repository<Amount>,
    private readonly xcelManager: fromShared.ExcelService,
  ) {}

  validator = new Validator();
  async save(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);
    if (!this.validator.arrayUnique) {
      throw fromShared.compose('Improper or inconsistent data');
    }
    const games = plainToClass(Game, data);
    await this.gameRepository.save(games).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
    const dbVersion = await this.dbversionRepository.save({
      db_version: `updated on ${Date.now()}`,
    });
  }

  async findAll(): Promise<Game[]> {
    let games = await this.gameRepository
      .createQueryBuilder('game')
      .innerJoinAndSelect('game.amounts', 'amounts')
      .orderBy({
        'game.game_id': 'ASC',
        'amounts.amount_value': 'ASC',
      })
      .getMany();

    const mappedGames = games.map(e => {
      let amounts = e.amounts.map(f => f.amount_display);
      e.selected_amount = amounts.toString();
      return e;
    });

    return mappedGames;
  }

  async saveAmount(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);
    if (!this.validator.arrayUnique) {
      throw fromShared.compose('Improper or inconsistent data');
    }

    const gamesAmount = data.map(async e => {
      const game = await this.gameRepository.findOne({
        relations: ['amounts'],
        where: {
          game_id: e.game_id,
        },
      });
      game.amounts = await this.amountRepository.findByIds(
        e.amounts.split(',').map(e => +e),
      );
      return game;
    });
    const allPromise = await Promise.all(gamesAmount);
    await this.gameRepository.save(allPromise).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async updateAmount(gameAmount: GameAmountDTO) {
    const game = await this.gameRepository.findOne({
      relations: ['amounts'],
      where: {
        game_id: gameAmount.game_id,
      },
    });

    const amounts = await this.amountRepository.findByIds(gameAmount.amounts);

    await this.gameRepository
      .createQueryBuilder()
      .relation('amounts')
      .of(gameAmount.game_id)
      .remove(game.amounts.map(e => e.amount_id));

    if (game) {
      game.amounts = amounts;
    }

    await this.gameRepository.save(game);
    const dbVersion = await this.dbversionRepository.save({
      db_version: `updated on ${Date.now()}`,
    });
  }

  async updateStatus(req: GameStatusDTO) {
    const game = await this.gameRepository
      .findOneOrFail({
        where: {
          game_id: req.game_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Game Not Found');
      });

    game.status = req.status;

    await this.gameRepository.save(game).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }
}
