import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class HTSlot {
  @PrimaryGeneratedColumn()
  slot_id: number;

  @Column()
  @Generated('uuid')
  slot_no: string;

  @Column({
    type: 'date',
  })
  slot_date: string;

  @Column({
    type: 'time without time zone',
  })
  slot_start_timing: string;

  @Column({
    type: 'time without time zone',
  })
  slot_end_timing: string;

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
