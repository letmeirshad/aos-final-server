import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Admin } from '../admin/admin.entity';
import * as fromShared from './../shared';

@Entity({
  orderBy: {
    transaction_id: 'ASC',
  },
})
export class UpiPayment {
  @PrimaryGeneratedColumn()
  transaction_id: number;

  @Column({
    nullable: false,
  })
  cust_id: number;

  @Column({
    nullable: true,
  })
  transaction_no: string;

  @Column({
    nullable: true,
  })
  transaction_type: string;

  @Column({
    nullable: true,
  })
  amount_point: number;

  @Column({
    nullable: true,
  })
  device_id: string;

  @Column({
    nullable: true,
  })
  upi_provider: string;

  @Column({
    nullable: true,
  })
  date_time: string;

  @Column({
    nullable: true,
  })
  upi_id: string;

  @Column({
    nullable: false,
  })
  mobile_no: string;

  // @Expose()
  // get joined_date() {
  //   return fromShared.Time.formatDateString(this.created_at);
  // }

  @CreateDateColumn({})
  @Exclude({
    toPlainOnly: true,
  })
  created_at;

  @UpdateDateColumn({})
  @Exclude({
    toPlainOnly: true,
  })
  updated_at;
}
