import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Bazaar } from './bazaar.entity';
import { BazaarDTO, SingleBazaarDate } from './bazaar.dto';
import * as fromShared from '../shared';
import { BazaarDate } from '../bazaar-date/bazaar-date.entity';
import { plainToClass } from 'class-transformer';
import { Validator } from 'class-validator';
import { Result } from '../results/results.entity';
import { Game } from '../game/game.entity';
import { DbVersion } from '../db-version/db-version.entity';

@Injectable()
export class BazaarService {
  constructor(
    @InjectRepository(Bazaar)
    @Optional()
    private readonly bazaarRepository: Repository<Bazaar>,
    @InjectRepository(DbVersion)
    @Optional()
    private readonly dbversionRepository: Repository<DbVersion>,
    @InjectRepository(BazaarDate)
    @Optional()
    private readonly bazaarDateRepository: Repository<BazaarDate>,
    @InjectRepository(Result)
    @Optional()
    private readonly resultRepository: Repository<Result>,
    @InjectRepository(Game)
    @Optional()
    private readonly gameRepository: Repository<Game>,
    @Optional()
    private readonly imageManager: fromShared.ImageService,
    @Optional()
    private readonly xcelManager: fromShared.ExcelService,
  ) {}
  validator = new Validator();

  async save(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);
    const promise = data.map(async element => {
      if (element.bazaar_image) {
        element.bazaar_image = await this.imageManager.addImage(
          element.bazaar_image,
          `bazaar${element.bazaar_name}`,
        );
      }
      return element;
    });
    const bazaars = plainToClass(Bazaar, await Promise.all(promise));
    await this.bazaarRepository.save(bazaars).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    const dbVersion = await this.dbversionRepository.save({
      db_version: `updated on ${Date.now()}`,
    });
  }

  async update(bazaar: BazaarDTO) {
    const existingBazaarName = await this.bazaarRepository.findOne({
      where: {
        bazaar_name: bazaar.bazaar_name,
        bazaar_id: Not(bazaar.bazaar_id),
      },
    });

    if (existingBazaarName) {
      throw fromShared.compose('Duplicate bazaar name');
    }

    if (bazaar.bazaar_image && this.validator.isBase64) {
      bazaar.bazaar_image = await this.imageManager.addImage(
        bazaar.bazaar_image,
        `bazaar${bazaar.bazaar_name}`,
      );
    }
    await this.bazaarRepository
      .createQueryBuilder()
      .update(Bazaar)
      .set(bazaar)
      .where('bazaar_id = :id', { id: bazaar.bazaar_id })
      .execute()
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });

    const dbVersion = await this.dbversionRepository.save({
      db_version: `updated on ${Date.now()}`,
    });
  }

  async findAll(req?: SingleBazaarDate) {
    const isAnotherDay = fromShared.Time.isMidNight(fromShared.Time.getTime());
    const bazaarDate =
      req && req.bazaar_date
        ? req.bazaar_date
        : isAnotherDay
        ? fromShared.Time.daysBack(1)
        : fromShared.Time.getCurrentDate();
    const bazaars = await this.bazaarRepository.find({
      relations: ['games'],
    });

    let sortedBazaars = fromShared.Time.sortBazaar(
      bazaars.sort((a, b) => fromShared.Time.compareTime(a.timing, b.timing)),
    );

    const promise = sortedBazaars.map(async e => {
      return this.getBazaarDetails(e.bazaar_id, bazaarDate);
    });
    return await Promise.all(promise);
  }

  async findTimeById(id) {
    const bazaarDetails = await this.getBazaarDetails(id);
    return { remaining_time: bazaarDetails.remaining_time };
  }

  async getBazaarDetails(id, date?) {
    const bazaar = await this.bazaarRepository
      .findOneOrFail({
        where: {
          bazaar_id: id,
        },
        relations: ['games'],
      })
      .catch(e => {
        throw fromShared.compose('Cannot find bazzar');
      });
    const isAnotherDay = fromShared.Time.isMidNight();
    const bazaarDate = date
      ? date
      : isAnotherDay
      ? fromShared.Time.daysBack(1)
      : fromShared.Time.getCurrentDate();

    let bazaarName = fromShared.getBazaarInitials(bazaar.bazaar_id);

    const currentBazaarDates = await this.bazaarDateRepository.findOne({
      where: {
        bazaar_date: bazaarDate,
      },
    });

    const currentFinal = await this.resultRepository.findOne({
      where: {
        bazaar_id: bazaar.bazaar_id,
        game_date: bazaarDate,
      },
    });

    const lastResult = await this.resultRepository.findOne({
      where: {
        bazaar_id: id,
      },
      order: {
        game_date: 'DESC',
      },
    });

    if (!currentBazaarDates) {
      throw fromShared.compose('Please update dates');
    }
    const bookingDate = currentBazaarDates[bazaarName] ? bazaarDate : null;
    const prevComputedDate = bookingDate
      ? bookingDate
      : fromShared.Time.getCurrentDate();
    const prevDate = fromShared.Time.daysBack(1);
    const diffTime = fromShared.Time.getBookingRemainingTime(
      bazaarDate,
      bazaar.timing,
      bazaar.close_before,
    );
    const isOpen = bookingDate && diffTime ? true : false;
    bazaar.booking_date = bookingDate;
    bazaar.is_open_for_booking = isOpen;
    bazaar.remaining_time = diffTime;
    bazaar.refund_payment = prevComputedDate === prevDate;
    bazaar.final = currentFinal ? currentFinal.final : '';
    bazaar.last_result =
      lastResult &&
      lastResult.result_paana &&
      lastResult.result_single_value >= 0
        ? `${lastResult.result_paana}-${lastResult.result_single_value}`
        : '';
    bazaar.last_result_date = lastResult
      ? fromShared.Time.dateFormatter(lastResult.game_date)
      : '';
    bazaar.current_result =
      currentFinal &&
      currentFinal.result_paana &&
      currentFinal.result_single_value >= 0
        ? `${currentFinal.result_paana}`
        : '';
    bazaar.result_enter_timing = fromShared.Time.getResultEnterTiming(
      bazaarDate,
      bazaar.timing,
    );
    bazaar.message =
      bazaar.remaining_time || bazaar.result_enter_timing
        ? `You can enter result after ${fromShared.Time.getTime24(
            bazaar.timing,
          )}`
        : bazaar.current_result
        ? ''
        : `Please enter result for ${bazaar.booking_date}`;
    bazaar.enable_result =
      !bazaar.remaining_time &&
      !bazaar.current_result &&
      !bazaar.result_enter_timing
        ? true
        : false;
    bazaar.game_map = bazaar.games.map(e => e.game_id);
    return bazaar;
  }

  async saveGame(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);
    if (!this.validator.arrayUnique) {
      throw fromShared.compose('Improper or inconsistent data');
    }
    const bazaarGames = data.map(async e => {
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
    const allPromise = await Promise.all(bazaarGames);
    await this.bazaarRepository.save(allPromise).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }
}
