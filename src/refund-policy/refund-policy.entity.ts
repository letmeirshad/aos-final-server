import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({
  orderBy: {
    refund_policy_id: 'ASC',
  },
})
export class RefundPolicy {
  @PrimaryGeneratedColumn({})
  refund_policy_id: number;

  @Column({})
  bazaar_id: number;

  @Column({
    type: 'date',
  })
  bazaar_date: string;

  @Column({
    type: 'decimal',
  })
  total_amount: number;

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
