import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CpCombination } from '../cp-combination/cp-combination.entity';

import { SingleResult } from '../single-result/single-result.entity';
import { Exclude } from 'class-transformer';
import { Result } from '../results/results.entity';
export enum PaanaType {
  SP = 'SP',
  DP = 'DP',
  TP = 'TP',
}
@Entity()
export class Paana {
  @PrimaryGeneratedColumn({})
  paana_id: number;

  @Column({
    unique: true,
  })
  paana_no: string;

  @Column({
    type: 'enum',
    enum: PaanaType,
  })
  paana_type: PaanaType;

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

  @OneToMany(
    type => CpCombination,
    cp_combination => cp_combination.paana,
  )
  cp_combinations: CpCombination[];

  @OneToOne(
    type => SingleResult,
    single_result => single_result.paana,
  )
  single_result: SingleResult;

  @OneToMany(
    type => Result,
    result => result.paana,
  )
  results: Result[];
}
