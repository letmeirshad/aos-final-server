import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum BetType {
  HEAD = 'H',
  TALE = 'T',
}

@Entity({
  orderBy: {
    result_id: 'ASC',
  },
})
export class HTResult {
  @PrimaryGeneratedColumn({})
  result_id: number;

  @Column({
    type: 'date',
  })
  game_date: string;

  @Column({
    unique: true,
  })
  slot: string;

  @Column({
    type: 'enum',
    enum: BetType,
  })
  bet_type: BetType;

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
