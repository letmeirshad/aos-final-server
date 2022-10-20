import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../authentication/auth.guard';
import {
  CustomerChatPagination,
  NewAdminChatDTO,
  NewCustChatDTO,
  Pagination,
  ReadStatus,
} from './chat.dto';
import { ChatService } from './chat.service';
import * as fromShared from '../shared';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/new/customer')
  async createCustomerChat(
    @Res() res: Response,
    @Body() newChat: NewCustChatDTO,
  ) {
    try {
      const chats = await this.chatService.newCustomerChat(newChat);
      fromShared.found(res, chats);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in new customer chat'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/new/admin')
  async createAdminChat(
    @Res() res: Response,
    @Body() newChat: NewAdminChatDTO,
  ) {
    try {
      const chat = await this.chatService.newAdminChat(newChat);
      fromShared.found(res, chat);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in new admin chat'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/all')
  async getAllChats(@Res() res: Response, @Body() getAll: Pagination) {
    try {
      const chats = await this.chatService.getAll(getAll);
      fromShared.saved(res, chats);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in retrieving all chat'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update-status')
  async updateStatus(@Res() res: Response, @Body() update: ReadStatus) {
    try {
      await this.chatService.markRead(update);
      fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in retrieving all chat'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/thread')
  async getSingleThread(
    @Res() res: Response,
    @Body() getThread: CustomerChatPagination,
  ) {
    try {
      const threads = await this.chatService.getChat(getThread);
      fromShared.found(res, threads);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in retrieving all chat'),
      );
    }
  }
}
