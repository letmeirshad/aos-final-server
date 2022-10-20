import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ChatEntity {
  CUSTOMER = 'C',
  ADMIN = 'A',
}
@Entity()
export class Chat {
  @PrimaryGeneratedColumn({})
  chat_id: number;

  @Column({})
  message: string;

  @Column({})
  cust_id: number;

  @Column({})
  admin_id: number;

  @Column({
    type: 'enum',
    enum: ChatEntity,
    nullable: false,
  })
  sent_by: ChatEntity;

  @CreateDateColumn({})
  @Exclude({
    toPlainOnly: true,
  })
  sent_at;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  is_read: boolean;
}
