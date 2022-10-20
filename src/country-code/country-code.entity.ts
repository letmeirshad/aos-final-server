import { CreateDateColumn, Column,  Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CountryCode {
    @PrimaryGeneratedColumn()
    country_code_id: number;

    @Column({})
    country_code: string;

    @Column({})
    country_name: string;
}