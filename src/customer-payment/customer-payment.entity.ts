import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';


export enum CustPaymentStatus {
  SUCCESS='SUCCESS',
  CANCELLED='CANCELLED',
  INITIATED='INITIATED',
}

@Entity({
  orderBy: {
    cust_payment_id: 'ASC',
  },
})
export class CustomerPayment {
  @PrimaryGeneratedColumn({})
  cust_payment_id: number;

  @Column({
  })
  cust_id: number;

  @Column({
    nullable: true,
  })
  initiated_amount: number;

  @Column({
    type: 'enum',
    enum: CustPaymentStatus,
    nullable: false,
    default: CustPaymentStatus.INITIATED
  })
  status: CustPaymentStatus

 


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
