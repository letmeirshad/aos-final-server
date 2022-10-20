import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import * as fromShared from './../shared';

@Entity({
  orderBy: {
    admin_ledger_id: 'ASC',
  },
})
export class AdminLedger {
  @PrimaryGeneratedColumn({})
  admin_ledger_id: number;

  @Column({
    type: 'date',
  })
  ledger_date: string;

  // @Column()
  // admin_id: number;

  @Column()
  booking_amount: number;

  @Column({
    type: 'decimal',
  })
  commission_amount: number;

  @Column({
    type: 'decimal',
    default: 0,
  })
  cashed_amount: number;

  @Column({
    type: 'decimal',
  })
  calculated_ledger: number;

  @Column({
    type: 'decimal',
  })
  settled_difference: number;

  @Column({
    type: 'decimal',
  })
  ledger_before_payment: number;

  @Column({
    default: 0,
    type: 'decimal',
  })
  last_day_remaining_ledger: number;

  @Column({
    type: 'enum',
    enum: fromShared.PaymentStatus,
    default: fromShared.PaymentStatus.NOT_PAID,
  })
  payment_status: fromShared.PaymentStatus;

  @Column({
    default: 0,
    type: 'decimal',
  })
  paid_amount_for_day: number;

  @Column({
    type: 'decimal',
  })
  ledger_after_payment: number;

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
}
