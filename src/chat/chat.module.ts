import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admin/admin.entity';
import { Customer } from '../customer/customer.entity';
import { SharedModule } from '../shared/shared.module';
import { ChatController } from './chat.controller';
import { Chat } from './chat.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Admin, Customer]), SharedModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
