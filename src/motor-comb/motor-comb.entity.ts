import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class MotorCombination {
  @PrimaryGeneratedColumn({})
  motor_comb_id: number;

  @Column({})
  paana_count: number;

  @Column({})
  sp_comb: number;

  @Column({})
  dp_comb: number;

  @Column({})
  tp_comb: number;

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
