import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Amount } from './amount.entity';
import { AmountDTO } from './amount.dto';
import * as fromShared from '../shared';

@Injectable()
export class AmountService {
  constructor(
    @InjectRepository(Amount)
    private readonly amountRepository: Repository<Amount>,
  ) {}

  async save(amount: AmountDTO) {
    if (amount.amount_id) {
      await this.amountRepository
        .findOneOrFail({
          where: { amount_id: amount.amount_id },
        })
        .catch(e => {
          throw fromShared.compose('Cannot find amount');
        });

      const existingAmount = await this.amountRepository.findOne({
        where: [
          {
            amount_id: Not(amount.amount_id),
            amount_value: amount.amount_value,
          },
          {
            amount_id: Not(amount.amount_id),
            amount_display: amount.amount_display,
          },
        ],
      });

      if (existingAmount) {
        throw fromShared.compose('Duplicate entry found');
      }

      await this.amountRepository
        .createQueryBuilder()
        .update(Amount)
        .set(amount)
        .where('amount_id = :id', { id: amount.amount_id })
        .execute()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });
    } else {
      const existingAmount = await this.amountRepository.findOne({
        where: [
          {
            amount_value: amount.amount_value,
          },
          {
            amount_display: amount.amount_display,
          },
        ],
      });

      if (existingAmount) {
        throw fromShared.compose('Duplicate entry found');
      }
      await this.amountRepository
        .createQueryBuilder()
        .insert()
        .into(Amount)
        .values(amount)
        .execute()
        .catch(e => {
          throw fromShared.compose(fromShared.operationFailed);
        });
    }
  }

  async findAll(): Promise<Amount[]> {
    return await this.amountRepository.find();
  }
}
