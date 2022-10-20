import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MotorCombination } from './motor-comb.entity';

@Injectable()
export class MotorCombinationService {
  constructor(
    @InjectRepository(MotorCombination)
    private readonly motorCombRepository: Repository<MotorCombination>,
  ) {}

  async findAll(): Promise<MotorCombination[]> {
    return await this.motorCombRepository.find();
  }
}
