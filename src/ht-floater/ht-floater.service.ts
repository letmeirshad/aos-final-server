import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HTFloater } from './ht-floater.entity';
import { FloaterUpdateDTO } from './ht-floater.dto';
import * as fromShared from '../shared';

@Injectable()
export class FloaterService {
  constructor(
    @InjectRepository(HTFloater)
    private readonly htFloaterRepository: Repository<HTFloater>,
  ) {}

  async save() {
    const findExisting = await this.htFloaterRepository.find();

    if (findExisting.length) {
      throw fromShared.compose('Existing Data found');
    }

    const newFloater = new HTFloater();

    await this.htFloaterRepository.save(newFloater).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async update(floater: FloaterUpdateDTO) {
    const findExisting = await this.htFloaterRepository.findOne({
      where: {
        floater_id: floater.floater_id,
      },
    });

    if (!findExisting) {
      throw fromShared.compose('floater data not found');
    }

    findExisting.status = floater.status;

    await this.htFloaterRepository.save(findExisting).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async findAll() {
    const floats = await this.htFloaterRepository.find();
    if (!floats.length) {
      throw fromShared.compose('Cant find Floater');
    }

    return floats[0];
  }
}
