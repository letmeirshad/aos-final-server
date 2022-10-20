import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
} from 'typeorm';
import { BetHistory } from '../bet-history/bet-history.entity';
import { Expose, Exclude } from 'class-transformer';
import { Result } from '../results/results.entity';
import { Game } from '../game/game.entity';

@Entity({
  orderBy: {
    bazaar_id: 'ASC',
  },
})
export class Bazaar {
  @PrimaryColumn({
    unique: true,
  })
  bazaar_id: number;

  @Column({
    unique: true,
  })
  bazaar_name: string;

  @Column({
    nullable: true,
  })
  bazaar_image: string;

  @Column({
    type: 'time without time zone',
  })
  timing: string;

  @Expose()
  booking_date;

  @Expose()
  remaining_time;

  @Expose()
  is_open_for_booking;

  @Expose()
  last_result;

  @Expose()
  last_result_date;

  @Expose()
  final;

  @Expose()
  current_result;

  @Expose()
  game_map;

  @Column({})
  close_before: number;

  @Expose()
  message: string;

  @Expose()
  enable_result: boolean;

  @Expose()
  result_enter_timing: number;

  @Expose()
  refund_payment: boolean;
  @Column({
    type: 'boolean',
    default: true,
  })
  status: boolean;

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
    type => BetHistory,
    bet_history => bet_history.bazaar,
  )
  bets_history: BetHistory[];

  @OneToMany(
    type => Result,
    result => result.bazaar,
  )
  results: Result[];

  @ManyToMany(
    type => Game,
    game => game.bazaars,
  )
  @JoinTable()
  games: Game[];
}
