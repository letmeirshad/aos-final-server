import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Result } from '../results/results.entity';

@Entity({
  orderBy: {
    cp_result_id: 'ASC',
  },
})
export class CpResult {
  @PrimaryGeneratedColumn({})
  cp_result_id: number;

  @Column({})
  result_id: number;

  @Column({})
  paana_no: string;

  @Column({})
  paana_combination: string;

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

  @ManyToOne(
    type => Result,
    result => result.cp_combinations,
  )
  @JoinColumn({
    referencedColumnName: 'result_id',
    name: 'result_id',
  })
  result: Result;
}
