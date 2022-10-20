import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import * as fromShared from '../shared';
import { CountryCode } from './country-code.entity';

@Injectable()
export class CountryCodeService {
  constructor(
    @InjectRepository(CountryCode)
    private readonly codeRepository: Repository<CountryCode>,
    private readonly xcelManager: fromShared.ExcelService,
  ) {}

  async save(filepath) {
    const data = await this.xcelManager.convertToJSON(filepath);
    this.codeRepository.clear();
    

    const dates = plainToClass(CountryCode, data);
    await this.codeRepository.save(dates).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async getCode(){
    const codes = await this.codeRepository.find().catch(e =>  {
      throw fromShared.compose(fromShared.operationFailed)
    });

    return codes;

  }

}
