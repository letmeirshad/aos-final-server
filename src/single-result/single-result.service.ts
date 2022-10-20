import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SingleResult } from './single-result.entity';

@Injectable()
export class SingleResultService {
  constructor(
    @InjectRepository(SingleResult)
    private readonly singleResultRepository: Repository<SingleResult>,
  ) {}

  async findAll(): Promise<SingleResult[]> {
    return await this.singleResultRepository.find();
  }
}
