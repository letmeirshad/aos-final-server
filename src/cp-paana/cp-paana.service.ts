import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CpPaana } from './cp-paana.entity';

@Injectable()
export class CpPaanaService {
  constructor(
    @InjectRepository(CpPaana)
    private readonly cpPaanaRepository: Repository<CpPaana>,
  ) {}

  async findAll(): Promise<CpPaana[]> {
    return await this.cpPaanaRepository.find();
  }
}
