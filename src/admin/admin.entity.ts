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
import { Expose, Exclude } from 'class-transformer';
// import { Role } from '../roles/roles.entity';
import { Customer } from '../customer/customer.entity';
import * as fromShared from './../shared';

@Entity({
  orderBy: {
    admin_id: 'ASC',
  },
})
export class Admin {
  @PrimaryGeneratedColumn()
  admin_id: number;

  @Column({
    nullable: true,
  })
  first_name: string;

  @Column({
    nullable: true,
  })
  last_name: string;

  @Expose()
  get full_name() {
    return `${this.first_name} ${this.last_name}`;
  }

  // @Column({
  //   default: 0,
  // })
  // points: number;

  @Column({
    unique: true,
  })
  mobile_no: string;

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

  // @Column({
  //   type: 'boolean',
  //   default: true,
  // })
  // is_first_time: boolean;

  // @Column({
  //   type: 'boolean',
  //   default: false,
  // })
  // is_blocked_by_admin: boolean;

  // @Column({
  //   type: 'boolean',
  //   default: false,
  // })
  // is_password_changed: boolean;

  @Expose()
  get joined_date() {
    return fromShared.Time.formatDateString(this.created_at);
  }

  // @Expose()
  // is_playstore

  // @Column({})
  // @Exclude({
  //   toPlainOnly: true,
  // })
  // created_by: number;

  // @Column({})
  // @Exclude({
  //   toPlainOnly: true,
  // })
  // updated_by: number;

  @CreateDateColumn({})
  @Exclude({
    toPlainOnly: true,
  })
  created_at;

  // @UpdateDateColumn({})
  // @Exclude({
  //   toPlainOnly: true,
  // })
  // updated_at;

  // @OneToMany(
  //   type => Admin,
  //   admin => admin.parent,
  // )
  // children: Admin[];

  // @ManyToOne(
  //   type => Admin,
  //   admin => admin.children,
  //   {
  //     onDelete: 'CASCADE',
  //   },
  // )
  // @JoinColumn({
  //   name: 'parent_admin_id',
  //   referencedColumnName: 'admin_id',
  // })
  // parent: Admin;

  // @ManyToOne(
  //   type => Role,
  //   role => role.admins,
  //   {
  //     onDelete: 'CASCADE',
  //   },
  // )
  // @JoinColumn({
  //   name: 'role_id',
  //   referencedColumnName: 'role_id',
  // })
  // role: Role;

  @OneToMany(
    type => OTP,
    otp => otp.admin,
  )
  otps: OTP[];
  user_token: string;
}
