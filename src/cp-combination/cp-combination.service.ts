import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CpCombination } from './cp-combination.entity';

@Injectable()
export class CpCombinationService {
  constructor(
    @InjectRepository(CpCombination)
    private readonly cpcombRepository: Repository<CpCombination>,
  ) {}

  async findAll(): Promise<CpCombination[]> {
    return await this.cpcombRepository.find();
  }
}
