import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from '../admin/admin.entity';
import { Customer } from '../customer/customer.entity';
import { Repository } from 'typeorm';
import {
  CustomerChatPagination,
  NewAdminChatDTO,
  NewCustChatDTO,
  Pagination,
  ReadStatus,
} from './chat.dto';
import { Chat } from './chat.entity';
import * as fromShared from './../shared';
import { In } from 'typeorm';
import { classToPlain } from 'class-transformer';

export enum ChatEntity {
  CUSTOMER = 'C',
  ADMIN = 'A',
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async newCustomerChat(req: NewCustChatDTO) {
    const customer = await this.customerRepository
      .findOne({
        where: {
          cust_id: req.cust_id,
          is_verified: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Customer not found');
      });

    const admin = await this.adminRepository.find();

    const chat = new Chat();
    chat.cust_id = customer.cust_id;
    chat.admin_id = admin[0].admin_id;
    chat.message = req.message;
    chat.sent_by = ChatEntity.CUSTOMER;

    const newChat = await this.chatRepository.save(chat).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    return newChat;
  }

  async newAdminChat(req: NewAdminChatDTO) {
    const customer = await this.customerRepository
      .findOne({
        where: {
          cust_id: req.cust_id,
          is_verified: true,
        },
      })
      .catch(e => {
        throw fromShared.compose('Customer not found');
      });

    const admin = await this.adminRepository.find();

    const chat = new Chat();
    chat.cust_id = customer.cust_id;
    chat.admin_id = admin[0].admin_id;
    chat.message = req.message;
    chat.sent_by = ChatEntity.ADMIN;
    chat.is_read = true;

    const newChat = await this.chatRepository.save(chat).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });

    return newChat;
  }

  async getAll(req: Pagination) {
    const chats = this.chatRepository;
    const query = {
      // order: {
      //   // is_read: false,
      //   // sent_at: 'DESC',
      // },
      select: ['cust_id', 'is_read'],
    };
    const paginated = await this.chatRepository.find({
      order: {
        sent_at: 'DESC',
        is_read: 'DESC',
        sent_by: 'DESC',
      },
    });

    const cust_ids = paginated.map(cust => cust.cust_id);

    if (cust_ids.length) {
      const unique_cust = [...new Set(cust_ids)];
      const query = {
        where: {
          cust_id: In(unique_cust),
        },
      };
      const total = await this.customerRepository.count(query);

      const allCustomers: any = classToPlain(
        await this.customerRepository.find(
          fromShared.PaginationService.paginate({
            totalData: total,
            currentPage: req.current_page,
            query: query,
          }),
        ),
      );

      console.log(allCustomers);
      console.log(unique_cust);

      const sortedResult = unique_cust
        .map((e: any) => {
          let unreadIndex = paginated.findIndex(
            chat => chat.is_read == false && chat.cust_id == e,
          );
          const custObj = allCustomers.find(cust => cust.cust_id == e);
          if (custObj) {
            if (unreadIndex >= 0) {
              custObj.is_unread = true;
            } else {
              custObj.is_unread = false;
            }

            return custObj;
          }
        })
        .filter(mapvalue => mapvalue);

      return {
        total_data: total,
        table_data: sortedResult,
      };
    }
    return {
      total_data: 0,
      table_data: [],
    };
  }

  async markRead(req: ReadStatus) {
    const unreadMessages = await this.chatRepository.find({
      where: {
        cust_id: req.cust_id,
        sent_by: ChatEntity.CUSTOMER,
        is_read: false,
      },
    });

    const chatIds = unreadMessages.map(chat => chat.chat_id);

    await this.chatRepository.update(chatIds, { is_read: true }).catch(e => {
      throw fromShared.compose(fromShared.operationFailed);
    });
  }

  async getChat(req: CustomerChatPagination) {
    const chats = this.chatRepository;
    const query = {
      where: {
        cust_id: req.cust_id,
      },
    };
    const totalCount = await chats.count(query);
    const paginated = await this.chatRepository
      .find(
        fromShared.PaginationService.paginate({
          totalData: totalCount,
          currentPage: req.current_page,
          query: {
            where: {
              cust_id: req.cust_id,
            },
            order: {
              sent_at: 'DESC',
            },
          },
        }),
      )
      .catch(e => {
        throw fromShared.operationFailed;
      });
    await this.chatRepository
      .update({ cust_id: req.cust_id }, { is_read: true })
      .catch(e => {
        throw fromShared.operationFailed;
      });
    return { total_data: totalCount, table_data: paginated.reverse() };
  }
}
