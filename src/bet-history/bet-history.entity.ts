import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Game } from '../game/game.entity';
import { Bazaar } from '../bazaar/bazaar.entity';
import { Customer } from '../customer/customer.entity';
import { Exclude, Expose, Transform } from 'class-transformer';
import * as fromShared from './../shared';

export enum PaanaType {
  SP = 'SP',
  DP = 'DP',
  TP = 'TP',
}

export enum BetStatus {
  BOOKING_DONE = 'Booking_Done',
  NOT_WON = 'Not_Won',
  WON_UNCLAIMED = 'Won_Unclaimed',
  WON_CLAIMED = 'Won_Claimed',
}

@Entity()
export class BetHistory {
  @PrimaryGeneratedColumn({})
  bet_id: number;

  @Column({})
  bazaar_id: number;

  @Column({})
  game_id: number;

  @Column({})
  cust_id: number;

  @Column({})
  selected_paana: string;

  @Column({})
  total_amount: number;

  @Column({})
  amount_per_paana: number;

  @Column({
    type: 'date',
  })
  @Transform(value => fromShared.Time.dateFormatter(value), {
    toPlainOnly: true,
  })
  game_date: string;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  is_claimed: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  is_winner: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  is_result_declared: boolean;

  @Column({
    nullable: true,
    type: 'decimal',
  })
  winning_amount: number;

  @Expose()
  get bet_status() {
    if (!this.is_result_declared) {
      return BetStatus.BOOKING_DONE;
    } else {
      if (!this.is_winner) {
        return BetStatus.NOT_WON;
      } else {
        if (this.is_claimed) {
          return BetStatus.WON_CLAIMED;
        } else {
          return BetStatus.WON_UNCLAIMED;
        }
      }
    }
  }

  @Column({
    type: 'enum',
    enum: PaanaType,
    nullable: true,
  })
  paana_type: PaanaType;

  @Column({
    type: 'boolean',
    default: true,
  })
  status: boolean;

  @Column({})
  @Exclude({
    toPlainOnly: true,
  })
  created_by: number;

  @Column({})
  @Exclude({
    toPlainOnly: true,
  })
  updated_by: number;

  @Expose()
  get booking_time() {
    return fromShared.Time.formatDateString(this.created_at);
  }

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
    type => Game,
    game => game.bets_history,
  )
  @JoinColumn({
    referencedColumnName: 'game_id',
    name: 'game_id',
  })
  game: Game;

  @ManyToOne(
    type => Bazaar,
    bazaar => bazaar.bets_history,
  )
  @JoinColumn({
    referencedColumnName: 'bazaar_id',
    name: 'bazaar_id',
  })
  bazaar: Bazaar;

  @ManyToOne(
    type => Customer,
    customer => customer.bets_history,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    referencedColumnName: 'cust_id',
    name: 'cust_id',
  })
  customer: Customer;
}
