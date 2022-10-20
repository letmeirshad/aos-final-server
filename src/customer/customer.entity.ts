import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { OTP } from '../OTP/otp.entity';
import { BetHistory } from '../bet-history/bet-history.entity';
import { Exclude, Expose } from 'class-transformer';
import { Admin } from '../admin/admin.entity';
import { CustomerTransaction } from '../customer-transactions/customer-transactions.entity';
import * as fromShared from './../shared';
import { HTBetHistory } from '../ht-bet-history/ht-bet-history.entity';

@Entity({
  orderBy: {
    cust_id: 'ASC',
  },
})
export class Customer {
  @PrimaryGeneratedColumn()
  cust_id: number;

  @Column({
    nullable: true,
  })
  first_name: string;

  @Column({
    nullable: true,
  })
  last_name: string;

  @Column({
    nullable: true,
  })
  device_id: string;

  @Column({
    nullable: true,
  })
  profile_image: string;

  @Column({
    default: 0,
  })
  points: number;

  @Column({
    unique: true,
  })
  mobile_no: string;

  @Column({
    default: '+91',
  })
  country_code: string;

  @Column({
    unique: true,
    nullable: true,
  })
  email: string;

  @Column({})
  @Exclude({
    toPlainOnly: true,
  })
  password: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  status: boolean;

  @Column({
    default: 0,
  })
  bonus: number;

  @Column()
  dob: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_verified: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_blocked: boolean;

  @Column({
    nullable: true,
  })
  account_no: string;

  @Column({
    nullable: true,
  })
  ifsc_code: string;

  @Column({
    nullable: true,
  })
  bank_name: string;

  @Column({
    nullable: true,
  })
  account_name: string;

  @Column({
    nullable: true,
  })
  account_type: string;

  @Column({
    nullable: true,
  })
  branch_name: string;

  @Expose()
  get is_kyc_completed() {
    if (
      this.ifsc_code &&
      this.account_no &&
      this.bank_name &&
      this.account_name &&
      this.account_type &&
      this.branch_name
    ) {
      return true;
    } else {
      return false;
    }
  }

  @Column({
    default: 0,
  })
  earned_amount: number;

  @Expose()
  last_month_won: number;

  @Expose()
  last_month_played: number;

  @Expose()
  get joined_date() {
    return fromShared.Time.formatDateString(this.created_at);
  }

  @Column({
    type: 'boolean',
    default: true,
  })
  is_first_time: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_password_changed: boolean;

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

  @Expose()
  get full_name() {
    return `${this.first_name} ${this.last_name}`;
  }

  @OneToMany(
    type => OTP,
    otp => otp.customer,
  )
  otps: OTP[];
  user_token: string;

  @OneToMany(
    type => BetHistory,
    bet_history => bet_history.customer,
  )
  bets_history: BetHistory[];

  @OneToMany(
    type => BetHistory,
    bet_history => bet_history.customer,
  )
  ht_bets_history: HTBetHistory[];

  @OneToMany(
    type => CustomerTransaction,
    transactions => transactions.customer,
  )
  transactions: CustomerTransaction[];
}
