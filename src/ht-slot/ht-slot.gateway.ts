import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HTSlotService } from './ht-slot.service';
import { InitialDataDTO } from './ht-slot.dto';
import * as fromShared from '../shared';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../authentication/wsAuth.guard';

@WebSocketGateway(+process.env.PORT)
export class HTSlotGateway {
  constructor(private readonly slotService: HTSlotService) {}
  @WebSocketServer()
  server: Server;

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('ht-initial-data')
  async create(
    @MessageBody() data: InitialDataDTO,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const initialDat = await this.slotService.initialData(data);
      client.emit('ht-initial-data-done', fromShared.wsSaved(initialDat));
    } catch (error) {
      client.emit(
        'ht-initial-data-error',
        fromShared.formatError(error, 'Error in creating paana'),
      );
    }
  }
}
