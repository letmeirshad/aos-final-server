import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paana } from '../paana/paana.entity';
import { CpPaana } from '../cp-paana/cp-paana.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class CpCombination {
  @PrimaryGeneratedColumn({})
  cp_combination_id: number;

  @Column({})
  paana_id: number;

  @Column({})
  cp_paana_id: number;

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

  @ManyToOne(
    type => Paana,
    paana => paana.cp_combinations,
    { eager: true },
  )
  @JoinColumn({
    referencedColumnName: 'paana_id',
    name: 'paana_id',
  })
  paana: Paana;

  @ManyToOne(
    type => CpPaana,
    cp_paana => cp_paana.cp_combinations,
  )
  @JoinColumn({
    referencedColumnName: 'cp_paana_id',
    name: 'cp_paana_id',
  })
  cp_paana: CpPaana;
}
