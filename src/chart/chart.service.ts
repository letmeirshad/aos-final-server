import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chart } from './chart.entity';
import * as fromShared from '../shared';
import { plainToClass } from 'class-transformer';
import { DbVersion } from '../db-version/db-version.entity';

@Injectable()
export class ChartService {
  constructor(
    @InjectRepository(Chart)
    private readonly chartRepository: Repository<Chart>,
    @InjectRepository(DbVersion)
    @Optional()
    private readonly dbversionRepository: Repository<DbVersion>,
    @Optional()
    private readonly xcelManager: fromShared.ExcelService,
  ) {}

  async save(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);

    const charts = plainToClass(Chart, data);
    await this.chartRepository.save(charts).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    const dbVersion = await this.dbversionRepository.save({
      db_version: `updated on ${Date.now()}`,
    });
  }

  async findAll(): Promise<Chart[]> {
    return await this.chartRepository.find();
  }
}
