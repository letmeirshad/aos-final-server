import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { HTConfig } from './ht-config.entity';
import { HTConfigDTO } from './ht-config.dto';
import * as fromShared from '../shared';

@Injectable()
export class HTCongigService {
  constructor(
    @InjectRepository(HTConfig)
    private readonly htConfigRepository: Repository<HTConfig>,
    private readonly xcelManager: fromShared.ExcelService,
  ) {}

  // async save(htConfig: HTConfigDTO) {
  //   const findExisting = await this.htConfigRepository.find();

  //   if (findExisting.length) {
  //     throw fromShared.compose('Existing configuration found');
  //   }

  //   const config = new HTConfig();

  //   config.start_timing = htConfig.start_timing;
  //   config.end_timing = htConfig.end_timing;
  //   config.interval_minutes = htConfig.interval_minutes;
  //   config.close_before_seconds = htConfig.close_before_seconds;
  //   config.maximum_bet_amount = htConfig.maximum_bet_amount;

  //   await this.htConfigRepository.save(config).catch(e => {
  //     throw fromShared.compose(fromShared.operationFailed);
  //   });
  // }

  async update(htConfig: HTConfigDTO) {
    let findExisting = await this.htConfigRepository.findOne({
      where: {
        config_id: htConfig.config_id,
      },
    });

    if (!findExisting) {
     findExisting = new HTConfig();
    }

    findExisting.start_timing = htConfig.start_timing;
    findExisting.end_timing = htConfig.end_timing;
    findExisting.interval_minutes = htConfig.interval_minutes;
    findExisting.close_before_seconds = htConfig.close_before_seconds;
   
    findExisting.maximum_bet_amount = htConfig.maximum_bet_amount;

    await this.htConfigRepository.save(findExisting).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async findAll() {
    const configs = await this.htConfigRepository.find();

    if (!configs.length) {
      throw fromShared.compose('Cant find configuration');
    }

    return configs[0];
  }
}
