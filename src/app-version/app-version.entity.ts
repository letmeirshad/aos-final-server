import { Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({
  orderBy: {
    app_version_id: 'ASC',
  },
})
export class AppVersion {
  @PrimaryGeneratedColumn({})
  app_version_id: number;

  @CreateDateColumn({})
  @Exclude({
    toPlainOnly: true,
  })
  created_at;
}
