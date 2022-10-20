import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BazaarResultHistory } from './bazaar-result-history.entity';
import * as fromShared from './../shared';

@Injectable()
export class BazaarHistoryService {
  constructor(
    @InjectRepository(BazaarResultHistory)
    private readonly bazaarResultRepository: Repository<BazaarResultHistory>,
  ) {}

  async findAll(req) {
    const total = await this.bazaarResultRepository.count();
    const allData = await this.bazaarResultRepository.find(
      fromShared.PaginationService.paginate({
        totalData: total,
        currentPage: req.current_page,
        dataPerPage: req.data_per_page,
        query: {
          order: {
            created_at: 'DESC',
          },
        },
      }),
    );

    return { total_data: total, table_data: allData };
  }
}
