import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Amount } from '../amount/amount.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity({
  orderBy: {
    game_id: 'ASC',
  },
})
export class CustomGame {
  @PrimaryColumn({
    unique: true,
  })
  game_id: number;

  @Column({
    unique: true,
  })
  game_name: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  status: boolean;

  @Expose()
  selected_amount;

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

  @ManyToMany(
    type => Amount,
    amount => amount.custom_games,
  )
  @JoinTable()
  amounts: Amount[];
}
