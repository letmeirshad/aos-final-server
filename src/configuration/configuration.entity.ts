import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({
  orderBy: {
    config_id: 'ASC',
  },
})
export class Configuration {
  @PrimaryColumn({
    unique: true,
  })
  config_id: number;

  @Column({
    unique: true,
  })
  config_key: string;

  @Column()
  config_value: string;

  @Column()
  display_value: string;
}
