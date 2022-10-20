import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class HTFloater {
  @PrimaryGeneratedColumn()
  floater_id: number;

  @Column({
    default: 0,
  })
  floater: number;

  @Column({
    type: 'boolean',
    default: false,
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
}
