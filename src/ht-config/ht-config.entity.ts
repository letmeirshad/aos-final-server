import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class HTConfig {
  @PrimaryGeneratedColumn()
  config_id: number;

  @Column({
    type: 'time without time zone',
  })
  start_timing: string;

  @Column({
    type: 'time without time zone',
  })
  end_timing: string;

  @Column({
    type: 'integer',
  })
  interval_minutes: number;

  @Column({
    type: 'integer',
  })
  close_before_seconds: number;

  @Column({
    nullable: true,
  })
  maximum_bet_amount: number;

  @Column({
    type: 'bool',
    default: false,
  })
  is_down: boolean;

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
