import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({})
export class AdminAnalysis {
  @PrimaryGeneratedColumn({})
  paana_entry_id: number;

  @Column()
  paana_no: string;

  @Column()
  bazaar_id: number;

  @Column()
  game_date: string;

  @Column()
  amount: number;
}
