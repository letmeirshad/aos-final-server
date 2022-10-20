import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Bazaar } from '../bazaar/bazaar.entity';
import { CpResult } from '../cp-result/cp-result.entity';
import { Paana } from '../paana/paana.entity';
import { ChartResult } from '../chart-result/chart-result.entity';

export enum PaanaType {
  SP = 'SP',
  DP = 'DP',
  TP = 'TP',
}

@Entity({
  orderBy: {
    result_id: 'ASC',
  },
})
export class Result {
  @PrimaryGeneratedColumn({})
  result_id: number;

  @Column({})
  bazaar_id: number;

  @Column({
    type: 'date',
  })
  game_date: string;

  @Column({
    nullable: true,
  })
  result_paana: string;

  @Column({
    nullable: true,
  })
  final: string;

  @Column({
    type: 'enum',
    enum: PaanaType,
    nullable: true,
  })
  result_type: PaanaType;

  @Column({
    nullable: true,
  })
  result_single_value: number;

  @Column({
    nullable: true,
  })
  bracket_result: string;

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

  @ManyToOne(
    type => Bazaar,
    bazaar => bazaar.results,
  )
  @JoinColumn({
    referencedColumnName: 'bazaar_id',
    name: 'bazaar_id',
  })
  bazaar: Bazaar;

  @OneToMany(
    type => CpResult,
    cp_result => cp_result.result,
  )
  cp_combinations: CpResult[];

  @OneToMany(
    type => ChartResult,
    chart_result => chart_result.result,
  )
  chart_combinations: ChartResult[];

  @ManyToOne(
    type => Paana,
    paana => paana.results,
  )
  @JoinColumn({
    referencedColumnName: 'paana_id',
    name: 'result',
  })
  paana: Paana;
}
