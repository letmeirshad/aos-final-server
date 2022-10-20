import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Amount } from '../amount/amount.entity';
import { BetHistory } from '../bet-history/bet-history.entity';
import { Exclude, Expose } from 'class-transformer';
import { Bazaar } from '../bazaar/bazaar.entity';

@Entity({
  orderBy: {
    game_id: 'ASC',
  },
})
export class Game {
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
    amount => amount.games,
  )
  @JoinTable()
  amounts: Amount[];

  @ManyToMany(
    type => Bazaar,
    bazaar => bazaar.games,
  )
  @JoinTable()
  bazaars: Bazaar[];

  @OneToMany(
    type => BetHistory,
    bet_history => bet_history.game,
  )
  bets_history: BetHistory[];
}
