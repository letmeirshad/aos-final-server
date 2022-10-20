import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';

@Entity()
export class Chart {
  @PrimaryGeneratedColumn({})
  chart_id: number;

  @Column()
  game_no: string;

  @Column()
  single_value: string;

  @Column()
  chart_name: string;

  @Column()
  paana_no: string;

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
