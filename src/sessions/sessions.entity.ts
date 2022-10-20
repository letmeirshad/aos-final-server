import { Entity, Column, PrimaryColumn } from 'typeorm';

export const SessionDTO = {
  cookie: Object,
  passport: Object,
};

@Entity()
export class Session {
  @PrimaryColumn()
  sid: string;

  @Column({
    type: 'json',
  })
  sess: JSON;

  @Column({
    type: 'timestamp without time zone',
  })
  expire: string;
}
