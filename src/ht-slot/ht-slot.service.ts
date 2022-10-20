import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HTSlot } from './ht-slot.entity';
import { HTSlotDTO, InitialDataDTO } from './ht-slot.dto';
import * as fromShared from '../shared';
import { HTConfig } from '../ht-config/ht-config.entity';
import { HTResult } from '../ht-results/ht-results.entity';
import { Customer } from '../customer/customer.entity';
import { HTBetHistory } from '../ht-bet-history/ht-bet-history.entity';

@Injectable()
export class HTSlotService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(HTSlot)
    private readonly htSlotrRepository: Repository<HTSlot>,
    @InjectRepository(HTConfig)
    private readonly configRepository: Repository<HTConfig>,
    @InjectRepository(HTResult)
    private readonly resultRepository: Repository<HTResult>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(HTBetHistory)
    private readonly betHistoryRepository: Repository<HTBetHistory>,
  ) {}

  async onApplicationBootstrap() {
    const currentDate = fromShared.Time.getCurrentDate();
    const configList = await this.configRepository.find().catch(e => {
      throw fromShared.compose('cannot find config');
    });

    if (configList.length) {
      await this.create(currentDate);
    }
  }
  async clear() {
    await this.htSlotrRepository.clear().catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async create(date) {
    const configList = await this.configRepository.find().catch(e => {
      throw fromShared.compose('cannot find config');
    });

    if (!configList.length) {
      throw fromShared.compose('Config not found');
    }

    const config = configList[0];
    const existingSlots = await this.htSlotrRepository.find({
      where: {
        slot_date: date,
      },
    });

    if (existingSlots.length) {
      return;
    }

    await this.htSlotrRepository.clear();
    const calculatedSlotTimings = fromShared.Time.calculateHTSlot(
      config.start_timing,
      config.end_timing,
      config.interval_minutes,
      config.close_before_seconds,
    );

    if (!calculatedSlotTimings.length) {
      throw fromShared.compose('Config Invalid');
    }

    const timings = calculatedSlotTimings.map(e => {
      const timing = new HTSlot();
      timing.slot_date = date;
      timing.slot_start_timing = e.startTiming;
      timing.slot_end_timing = e.endTiming;
      return timing;
    });

    const slots = await this.htSlotrRepository.save(timings).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    return slots;
  }

  async findAll() {
    const slots = await this.htSlotrRepository.find({
      where: {
        slot_date: fromShared.Time.getCurrentDate(),
      },
    });
    if (!slots.length) {
      throw fromShared.compose('Cant find Floater');
    }

    return slots;
  }

  async findSlot(slotDetails: HTSlotDTO) {
    const slot = await this.htSlotrRepository
      .findOneOrFail({
        where: {
          slot_no: slotDetails.slot_no,
        },
      })
      .catch(e => {
        throw fromShared.compose('cannot find slot');
      });

    const remainingTime = fromShared.Time.calcHTRemainingTime(
      slot.slot_end_timing,
    );

    return {
      remaining_time: remainingTime,
      slot_no: slotDetails.slot_no,
    };
  }

  async getCurrentSlot() {
    const slots = await this.htSlotrRepository.find();
    const configs = await this.configRepository.find();
    let config: HTConfig;
    if (configs.length) {
      config = configs[0];
    } else {
      throw fromShared.compose('Config not found');
    }
    if (!slots.length) {
      throw fromShared.compose('Can not found slot');
    }

    return fromShared.Time.getCurrentSlot(slots, config.close_before_seconds);
  }

  async initialData(data: InitialDataDTO) {
    const customer = await this.customerRepository
      .findOneOrFail({
        where: {
          cust_id: data.cust_id,
          is_blocked: false,
          status: true,
          is_verified: true
        },
      })
      .catch(e => {
        throw fromShared.compose('Cannot find customer');
      });

    const currentSlot = await this.getCurrentSlot();
    if (!currentSlot) {
      throw fromShared.compose('Error in finding currentSlot');
    }

    const configList = await this.configRepository.find().catch(e => {
      throw fromShared.compose('cannot find config');
    });

    if (!configList.length) {
      throw fromShared.compose('Config not found');
    }

    const config = configList[0];

    const currentSlotId = currentSlot.slot_no;

    let existingBetData;

    const existingBet = await this.betHistoryRepository.find({
      where: {
        cust_id: data.cust_id,
        slot: currentSlotId,
      },
    });

    if (existingBet.length) {
      existingBetData = existingBet;
    } else {
      existingBetData = null;
    }

    const remainingTime = await this.findSlot({
      slot_no: currentSlotId,
    });

    const results = await this.resultRepository
      .find({
        take: 10,
        select: ['bet_type'],
        order: {
          created_at: 'DESC',
        },
      })
      .catch(e => {
        throw fromShared.compose('Cant find results');
      });

    return {
      current_slot: remainingTime,
      last_results: results,
      existing_bet: existingBetData,
      interval_time: config.interval_minutes,
      start_time: config.start_timing,
      end_time: config.end_timing,
      close_before: config.close_before_seconds,
      maximum_amount: config.maximum_bet_amount,
    };
  }
}
