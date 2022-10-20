import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbVersion } from './db-version.entity';
import { DbVersionDTO } from './db-version.dto';

@Injectable()
export class DbVersionService {
  constructor(
    @InjectRepository(DbVersion)
    private readonly dbversionRepository: Repository<DbVersion>,
  ) {}

  async save(db: DbVersionDTO) {
    await this.dbversionRepository
      .createQueryBuilder()
      .insert()
      .into(DbVersion)
      .values(db)
      .execute();
  }

  async findAll(): Promise<DbVersion[]> {
    return await this.dbversionRepository.find();
  }

  async findLatest(): Promise<DbVersion> {
    return await this.dbversionRepository.findOne({
      order: {
        created_at: 'DESC',
      },
    });
  }
}
