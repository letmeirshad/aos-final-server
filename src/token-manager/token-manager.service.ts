import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fromShared from '../shared';
import { TokenManager } from './token-manager.entity';

@Injectable()
export class TokenManagerService {
  constructor(
    @InjectRepository(TokenManager)
    private readonly tokenManagerRepository: Repository<TokenManager>,
    private readonly externalService: fromShared.ExternalService,
  ) {}

  async updateToken() {
    const token = await this.externalService.paymentAuthenticate();
    if (!token) {
      throw fromShared.compose("Token can't be generated");
    }
    let tokenManager;
    const existingToken = await this.tokenManagerRepository.find();
    if (existingToken.length) {
      tokenManager = existingToken[0];
    } else {
      tokenManager = new TokenManager();
    }

    tokenManager.token = token;

    await this.tokenManagerRepository.save(tokenManager).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    return token;
  }

  async getToken() {
    const existingToken = await this.tokenManagerRepository.find();
    if (existingToken.length) {
      return existingToken[0].token;
    } else {
      return null;
    }
  }
}
