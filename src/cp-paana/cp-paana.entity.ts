import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { CpCombination } from '../cp-combination/cp-combination.entity';

@Entity()
export class CpPaana {
  @PrimaryGeneratedColumn({})
  cp_paana_id: number;

  @Column({
    unique: true,
  })
  cp_paana_no: string;

  @CreateDateColumn()
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
    cp_combination => cp_combination.cp_paana,
    {
      eager: true,
    },
  )
  cp_combinations: CpCombination[];
}
