import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bazaar } from './../bazaar/bazaar.entity';
import { Game } from './../game/game.entity';
import { Paana } from '../paana/paana.entity';
import { CpPaana } from '../cp-paana/cp-paana.entity';
import { MotorCombination } from '../motor-comb/motor-comb.entity';
import { classToPlain, plainToClass } from 'class-transformer';
import { DbVersion } from '../db-version/db-version.entity';
import { BazaarService } from '../bazaar/bazaar.service';
import * as fromShared from '../shared';
import { SingleResult } from '../single-result/single-result.entity';
import { CpCombination } from '../cp-combination/cp-combination.entity';
import { Amount } from '../amount/amount.entity';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { Configuration } from '../configuration/configuration.entity';
import { AppVersion } from '../app-version/app-version.entity';
import { Chart } from '../chart/chart.entity';
import { CustomGame } from '../custom-game/custom-game.entity';

@Injectable()
export class MasterService {
  constructor(
    @InjectRepository(Paana)
    private readonly paanaRepository: Repository<Paana>,
    @InjectRepository(SingleResult)
    private readonly singleResultRepository: Repository<SingleResult>,
    @InjectRepository(CpPaana)
    private readonly cpPaanaRepository: Repository<CpPaana>,
    @InjectRepository(CpCombination)
    private readonly cpComboRepository: Repository<CpCombination>,
    @InjectRepository(MotorCombination)
    private readonly motorCombRepository: Repository<MotorCombination>,
    @InjectRepository(Bazaar)
    private readonly bazaarRepository: Repository<Bazaar>,
    @InjectRepository(BazaarDate)
    private readonly bazaarDateRepository: Repository<BazaarDate>,
    @InjectRepository(Amount)
    private readonly amountRepository: Repository<Amount>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Chart)
    private readonly chartRepository: Repository<Chart>,

    @InjectRepository(Configuration)
    private readonly configRepository: Repository<Configuration>,
    @InjectRepository(AppVersion)
    private readonly appVersionRepository: Repository<AppVersion>,
    @InjectRepository(DbVersion)
    private readonly dbversionRepository: Repository<DbVersion>,
    @InjectRepository(CustomGame)
    private readonly customGameRepository: Repository<CustomGame>,
    @Inject(BazaarService)
    private readonly bazaarService: BazaarService,
    private readonly xcelManager: fromShared.ExcelService,
    private readonly imageManager: fromShared.ImageService,
  ) {}

  async save(filepath) {
    const data = await this.xcelManager.convertToJSONS(filepath);
    // Paana
    const paanaData = data.paana.map(e => {
      e.paana_no = e.paana_no.toString();
      return e;
    });

    const paana = await this.paanaRepository.find();

    if (!paana.length) {
      await this.paanaRepository.save(plainToClass(Paana, paanaData));
    }

    // SingleResult
    const singleResult = await this.singleResultRepository.find();

    if (!singleResult.length) {
      await this.singleResultRepository.save(
        plainToClass(SingleResult, data.single),
      );
    }

    // CpPaana
    const cpPaana = await this.cpPaanaRepository.find();
    if (!cpPaana.length) {
      await this.cpPaanaRepository.save(plainToClass(CpPaana, data.cp));
    }

    // CpCombo
    const cpCombo = await this.cpComboRepository.find();
    if (!cpCombo.length) {
      await this.cpComboRepository.save(
        plainToClass(CpCombination, data.cpcombo),
      );
    }

    // MotorCombo
    const motorCombo = await this.motorCombRepository.find();
    if (!motorCombo.length) {
      await this.motorCombRepository.save(
        plainToClass(CpCombination, data.motorcombo),
      );
    }

    // Bazaar
    const promise = data.bazaars.map(async element => {
      if (element.bazaar_image) {
        element.bazaar_image = await this.imageManager.addImage(
          element.bazaar_image,
          `bazaar${element.bazaar_name}`,
        );
      }

      return element;
    });

    const existingBazaars = await this.bazaarRepository.find();
    const bazaarIds = existingBazaars.map(e => e.bazaar_id);
    const newBazaars = await Promise.all(promise);

    newBazaars.forEach((e: any, i) => {
      let currIndex = bazaarIds.findIndex(f => f === e.bazaar_id);
      if (currIndex >= 0) {
        newBazaars[i] = existingBazaars[currIndex];
      }
    });

    const bazaars = await this.bazaarRepository.save(
      plainToClass(Bazaar, newBazaars),
    );

    // Game
    const games = await this.gameRepository.save(
      plainToClass(Game, data.games),
      {
        reload: true,
      },
    );

    // Amount
    const amounts = await this.amountRepository.save(
      plainToClass(Amount, data.amounts),
    );

    // GameAmount
    const gamePromise = data.gameamount.map(async e => {
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
    const gameAmount = await this.gameRepository.save(
      await Promise.all(gamePromise),
    );

    // BazaarDate

    // data.bazaardate.forEach(element => {
    //   element.bazaar_date = fromShared.Time.format(element.bazaar_date);
    // });
    // const bazaarDate = await this.bazaarDateRepository.find();

    // if(!bazaarDate.length){
    //   await this.bazaarDateRepository.save(
    //     plainToClass(BazaarDate, data.bazaardate),
    //   );
    // }

    // Roles
    // const roles = await this.roleRepository.save(
    //     plainToClass(Role, data.Sheet11)
    // )

    // Configurations
    const existingConfs = await this.configRepository.find();
    const confIds = existingConfs.map(e => e.config_id);
    const newConfs = data.configuration;

    newConfs.forEach((e: any, i) => {
      let currIndex = confIds.findIndex(f => f === e.config_id);
      if (currIndex >= 0) {
        newConfs[i] = existingConfs[currIndex];
      }
    });

    const configuration = await this.configRepository.save(
      plainToClass(Configuration, newConfs),
    );

    // BazaarGame
    const bazaarGamePromise = data.bazaargame.map(async e => {
      const bazaar = await this.bazaarRepository.findOne({
        relations: ['games'],
        where: {
          bazaar_id: e.bazaar_id,
        },
      });

      await this.bazaarRepository
        .createQueryBuilder()
        .relation('games')
        .of(e.bazaar_id)
        .remove(bazaar.games.map(e => e.game_id));

      bazaar.games = await this.gameRepository.findByIds(
        e.games.split(',').map(e => +e),
      );

      return bazaar;
    });
    const bazaarGame = await this.bazaarRepository.save(
      await Promise.all(bazaarGamePromise),
    );

    // Chart

    const chart = await this.chartRepository.find();

    if (!chart.length) {
      await this.chartRepository.save(plainToClass(Chart, data.chart));
    }

    const customGames = await this.customGameRepository.save(
      plainToClass(CustomGame, data.customgames),
    );

    const customGamePromise = data.customgameamount.map(async e => {
      const game = await this.customGameRepository.findOne({
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
    const customGameAmount = await this.customGameRepository.save(
      await Promise.all(customGamePromise),
    );

    // Db
    const dbVersion = await this.dbversionRepository.save({
      db_version: `updated on ${Date.now()}`,
    });
  }

  async find() {
    const response: any = {};
    let bazaars = await this.bazaarService.findAll();

    let games = await this.gameRepository
      .createQueryBuilder('game')
      .innerJoinAndSelect('game.amounts', 'amounts')
      .orderBy({
        'game.game_id': 'ASC',
        'amounts.amount_value': 'ASC',
      })
      .getMany();

    let db_ver = await this.dbversionRepository.findOne({
      order: {
        created_at: 'DESC',
      },
    });

    const gamesFinal = games.map(e => {
      let games = {
        game_id: e.game_id,
        game_name: e.game_name,
        status: e.status,
        amount_detail: e.amounts.map(f => {
          return {
            amount_id: f.amount_id,
            amount_display: f.amount_display,
            amount_value: f.amount_value,
          };
        }),
      };

      return games;
    });

    let paanas = await this.paanaRepository.find({
      relations: ['single_result'],
    });

    const paanasFinal = paanas.map((e: any) => {
      e.single_value = e.single_result.single_value;
      delete e.single_result;
      return e;
    });

    let cp_paanas = await this.cpPaanaRepository.find();

    let motor_combos = await this.motorCombRepository.find();

    let charts_data = await this.chartRepository.find();

    response.motor_comb_details = classToPlain(motor_combos);
    response.bazaar_details = classToPlain(bazaars);
    response.game_details = gamesFinal;
    response.paana_details = classToPlain(paanasFinal);
    response.cp_paanas_details = classToPlain(cp_paanas);
    response.version = classToPlain(db_ver);
    response.chart_details = classToPlain(charts_data);
    return response;
  }

  async saveApk(file) {
    const appVersion = new AppVersion();
    await this.appVersionRepository.save(appVersion).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }
}
