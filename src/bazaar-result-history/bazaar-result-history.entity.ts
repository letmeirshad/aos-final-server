import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import * as fromShared from './../shared';

@Entity({
  orderBy: {
    bazaar_result_history: 'ASC',
  },
})
export class BazaarResultHistory {
  @PrimaryGeneratedColumn({})
  bazaar_result_history: number;

  @Column({})
  @Transform(value => fromShared.Time.dateFormatter(value), {
    toPlainOnly: true,
  })
  result_date: string;

  @Column({
    nullable: true,
  })
  KO_KC: string;

  @Column({
    nullable: true,
  })
  MO_MC: string;

  @Column({
    nullable: true,
  })
  TO_TC: string;

  @Column({
    nullable: true,
  })
  MDO_MDC: string;

  @Column({
    nullable: true,
  })
  MNO_MNC: string;

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
