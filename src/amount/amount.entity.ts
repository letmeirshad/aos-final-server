import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
} from 'typeorm';
import { Game } from '../game/game.entity';
import { CustomGame } from '../custom-game/custom-game.entity';
import { Exclude } from 'class-transformer';

@Entity({
  orderBy: {
    amount_value: 'ASC',
  },
})
export class Amount {
  @PrimaryColumn({
    unique: true,
  })
  amount_id: number;

  @Column({
    unique: true,
  })
  amount_value: number;

  @Column({
    unique: true,
  })
  amount_display: string;

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

  @ManyToMany(
    type => Game,
    game => game.amounts,
  )
  games: Game[];

  @ManyToMany(
    type => CustomGame,
    custom_game => custom_game.amounts,
  )
  custom_games: CustomGame[];
}
