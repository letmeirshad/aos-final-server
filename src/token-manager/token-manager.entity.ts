import { CreateDateColumn, Column,  Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TokenManager {
    @PrimaryGeneratedColumn()
    token_id: number;

    @Column({})
    token: string;

    @CreateDateColumn()
  created_at;
}