import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../authentication/wsAuth.guard';
import { EntityManager, TransactionManager } from 'typeorm';
import {
  BetHistoryListDTO,
  CancelBetDTO,
  MultipleHTBetRequestsDTO,
} from './ht-bet-history.dto';
import { HTBetHistoryService } from './ht-bet-history.service';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';

@WebSocketGateway(+process.env.PORT)
export class HTBetHistoryGateway {
  constructor(private readonly betHistoryService: HTBetHistoryService) {}
  @WebSocketServer()
  server: Server;

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('new-ht-bet')
  async create(
    @MessageBody() betHistory: MultipleHTBetRequestsDTO,
    @TransactionManager() manager: EntityManager,
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      const bets = [];
      for (let i = 0; i < betHistory.bets.length; i++) {
        const bet = await this.betHistoryService.create(
          betHistory.bets[i],
          manager,
        );
        bets.push(bet);
      }

      const dta = {
        slot: bets[0].slot,
        points: bets.length > 1 ? bets[1].points : bets[0].points,
        bets: bets,
      };

      client.emit('new-ht-bet-done', fromShared.wsSaved(dta));
    } catch (error) {
      client.emit(
        'new-ht-bet-error',
        fromShared.formatError(error, 'Error in creating new bet'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('cancel-ht-bet')
  async cancel(
    @MessageBody() filter: CancelBetDTO,
    @ConnectedSocket() client: Socket,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      const bazaars = await this.betHistoryService.cancel(filter, manager);
      client.emit('cancel-ht-bet-done', fromShared.wsSaved(bazaars));
    } catch (error) {
      client.emit(
        'cancel-ht-bet-error',
        fromShared.formatError(error, 'Error in cancelling'),
      );
    }
  }
}
