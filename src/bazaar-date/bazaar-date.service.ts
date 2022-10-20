import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BazaarDate } from './bazaar-date.entity';
import { BazaarDateDTO } from './bazaar-date.dto';
import * as fromShared from '../shared';
import { plainToClass } from 'class-transformer';

@Injectable()
export class BazaarDateService {
  constructor(
    @InjectRepository(BazaarDate)
    private readonly bazaarDateRepository: Repository<BazaarDate>,
    private readonly xcelManager: fromShared.ExcelService,
  ) {}

  async save(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);
    this.bazaarDateRepository.clear();
    data.forEach(element => {
      element.bazaar_date = fromShared.Time.format(element.bazaar_date);
    });

    const dates = plainToClass(BazaarDate, data);
    await this.bazaarDateRepository.save(dates).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async findAll(req) {
    const allDates = await this.bazaarDateRepository.find();
    const filtredDates = allDates.filter(element =>
      fromShared.Dates.checkMonth(element.bazaar_date, req.month, req.year),
    );
    return filtredDates;
  }

  async update(bazarDate: BazaarDateDTO) {
    await this.bazaarDateRepository
      .createQueryBuilder()
      .update(BazaarDate)
      .set(bazarDate)
      .where('bazaar_date = :date', { date: bazarDate.bazaar_date })
      .execute()
      .catch(e => {
        throw fromShared.compose(fromShared.operationFailed);
      });
  }
}
