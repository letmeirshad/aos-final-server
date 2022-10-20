import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Exclude, Expose, Transform } from 'class-transformer';
import * as fromShared from '../shared';

export enum BetType {
  HEAD = 'H',
  TALE = 'T',
}
@Entity()
export class HTBetHistory {
  @PrimaryGeneratedColumn({})
  bet_id: number;

  @Column({})
  cust_id: number;

  @Column({})
  total_amount: number;

  @Column({
    type: 'enum',
    enum: BetType,
  })
  bet_type: BetType;

  @Column({
    type: 'date',
  })
  @Transform(value => fromShared.Time.dateFormatter(value), {
    toPlainOnly: true,
  })
  game_date: string;

  @Column()
  slot: string;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  is_winner: boolean;

  @Column({
    nullable: true,
    type: 'decimal',
  })
  winning_amount: number;

  @Expose()
  get booking_time() {
    return fromShared.Time.formatDateString(this.created_at);
  }

  @CreateDateColumn({})
  @Exclude({
    toPlainOnly: true,
  })
  created_at;

  @UpdateDateColumn()
  @Exclude({
    toPlainOnly: true,
  })
  updated_at;

  @ManyToOne(
    type => Customer,
    customer => customer.ht_bets_history,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    referencedColumnName: 'cust_id',
    name: 'cust_id',
  })
  customer: Customer;
}
