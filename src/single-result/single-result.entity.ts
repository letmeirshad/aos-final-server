import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Paana } from '../paana/paana.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class SingleResult {
  @PrimaryGeneratedColumn({})
  single_result_id: number;

  @Column({})
  single_value: number;

  @Column({})
  paana_id: number;

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

  @OneToOne(
    type => Paana,
    paana => paana.single_result,
  )
  @JoinColumn({
    referencedColumnName: 'paana_id',
    name: 'paana_id',
  })
  paana: Paana;
}
