import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paana } from './paana.entity';

@Injectable()
export class PaanaService {
  constructor(
    @InjectRepository(Paana)
    private readonly paanaRepository: Repository<Paana>,
  ) {}

  async findAll(): Promise<Paana[]> {
    return await this.paanaRepository.find();
  }
}
