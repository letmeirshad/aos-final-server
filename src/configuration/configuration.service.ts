import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from './configuration.entity';
import { ConfigurationDTO } from './configuration.dto';
import * as fromShared from '../shared';
import { Validator } from 'class-validator';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Configuration)
    private readonly configRepository: Repository<Configuration>,
    @Optional() private readonly xcelManager: fromShared.ExcelService,
  ) {}

  validator = new Validator();

  async new(conf: ConfigurationDTO) {
    const config = await this.configRepository
      .findOne({
        where: {
          config_key: conf.config_key,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find config');
      });

    if (config) {
      throw fromShared.compose('Already Present');
    }

    const configuration = new Configuration();
    configuration.config_key = conf.config_key;
    configuration.config_value = conf.config_value;
    configuration.display_value = conf.display_value;
    configuration.config_id = conf.config_id;

    await this.configRepository.save(configuration).catch(e => {
      
      throw fromShared.compose(fromShared.operationFailed);

    });
  }

  async update(conf: ConfigurationDTO) {
    const config = await this.configRepository
      .findOneOrFail({
        where: {
          config_id: conf.config_id,
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find config');
      });

    config.config_value = conf.config_value;

    await this.configRepository.save(config).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async findAll(): Promise<Configuration[]> {
    return await this.configRepository.find();
  }

  async findByKey(key): Promise<Configuration> {
    return await this.configRepository
      .findOneOrFail({
        where: {
          config_key: key,
        },
      })
      .catch(e => {
        throw fromShared.compose('Error in finding configuration');
      });
  }
}
