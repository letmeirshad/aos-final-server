import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Admin } from '../admin/admin.entity';

@Entity()
export class OTP {
  @PrimaryGeneratedColumn({})
  otp_id: number;

  @Column({
    unique: true,
  })
  otp_value: number;

  @Column({})
  otp_expiration: string;

  @Column({
    nullable: true,
  })
  cust_id: number;

  @Column({
    nullable: true,
  })
  admin_id: number;

  @CreateDateColumn({})
  created_at;

  @UpdateDateColumn()
  updated_at;

  @ManyToOne(
    type => Customer,
    customer => customer.otps,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    referencedColumnName: 'cust_id',
    name: 'cust_id',
  })
  customer: Customer;

  @ManyToOne(
    type => Admin,
    admin => admin.otps,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    referencedColumnName: 'admin_id',
    name: 'admin_id',
  })
  admin: Admin;
}
