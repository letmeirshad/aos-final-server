import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Customer } from '../customer/customer.entity';
import * as fromShared from './../shared';

@Entity({
  orderBy: {
    cust_trxn_id: 'ASC',
  },
})
export class CustomerTransaction {
  @PrimaryGeneratedColumn({})
  cust_trxn_id: number;

  @Column({
    nullable: true,
  })
  cust_id: number;

  @Column({
    nullable: true,
  })
  debit_amount: number;

  @Column({
    nullable: true,
  })
  credit_amount: number;

  @Column()
  final_amount: number;

  @Column({})
  particulars: string;

  @Column({
    nullable: true
  })
  recharge_trxn_id: string;

  @Column({
    type: 'enum',
    enum: fromShared.TrxnType,
    default: fromShared.TrxnType.TRXN,
  })
  transaction_type: fromShared.TrxnType;

  @Expose()
  get trxn_date() {
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
    cust => cust.transactions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'cust_id',
    referencedColumnName: 'cust_id',
  })
  customer: Customer;
}
