import { Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentEntity {
  CUSTOMER = 'C',
  ADMIN = 'A',
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  INITITALIZED = 'INITIALIZED',
  INPROGRESS = 'INPROGRESS',
  FAILED_WITH_ERROR = 'FAILED_WITH_ERROR',
}
@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: string;

  @Column({})
  bill_id: string;

  @Column({})
  cust_id: number;

  @Column({})
  amount: number;

  @Column({})
  admin_id: number;

  @Column({
    nullable: true,
  })
  transaction_details: string;

  @Column({
    type: 'enum',
    enum: PaymentEntity,
    nullable: false,
  })
  requested_by: PaymentEntity;

  @Column({
    default: 0,
  })
  retry: number;

  @Column({
    default: false,
  })
  is_sent: boolean;

  @Expose()
  get should_retry() {
    return this.retry > 3 && this.status === PaymentStatus.INPROGRESS;
  }

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    nullable: false,
    default: PaymentStatus.INITITALIZED,
  })
  status: PaymentStatus;

  @CreateDateColumn()
  created_at;

  @UpdateDateColumn()
  updated_at;
}
