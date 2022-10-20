import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity({
  orderBy: {
    db_version_id: 'ASC',
  },
})
export class DbVersion {
  @PrimaryGeneratedColumn({})
  db_version_id: number;

  @Column({
    unique: true,
  })
  db_version: string;

  @Expose()
  get version() {
    return `v${this.db_version_id}`;
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
}
