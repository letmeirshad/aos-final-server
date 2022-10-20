import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import * as fromShared from './../shared';

@Entity({
  orderBy: {
    bazaar_date: 'ASC',
  },
})
export class BazaarDate {
  @PrimaryColumn({
    type: 'date',
  })
  bazaar_date: string;

  @Column({
    nullable: true,
  })
  message: string;

  @Column({
    nullable: true,
    type: 'boolean',
    default: true,
  })
  KO: boolean;

  @Column({
    nullable: true,
    type: 'boolean',
    default: true,
  })
  KC: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  MO: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  MC: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  TO: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  TC: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  MDO: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  MDC: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  MNO: boolean;

  @Column({
    nullable: true,
    default: true,
    type: 'boolean',
  })
  MNC: boolean;

  @Expose()
  get can_edit() {
    return fromShared.Time.getCurrentDateStatus(this.bazaar_date);
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
}
