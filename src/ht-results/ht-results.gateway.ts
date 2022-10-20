import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HTResultService } from './ht-results.service';
import * as fromShared from '../shared';
import { SlotResultDTO } from './ht-results.dto';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../authentication/wsAuth.guard';

@WebSocketGateway(+process.env.PORT)
export class HTResultGateway {
  constructor(private readonly resultService: HTResultService) {}
  @WebSocketServer()
  server: Server;

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('ht-results')
  async getResult(
    @MessageBody() body: SlotResultDTO,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.resultService.getSlotResult(body);
      client.emit('ht-results-done', fromShared.wsFound(result));
    } catch (error) {
      client.emit(
        'ht-results-error',
        fromShared.formatError(error, 'Error in finding result'),
      );
    }
  }
}
