import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartController } from './chart.controller';
import { Chart } from './chart.entity';
import { ChartService } from './chart.service';
import { SharedModule } from '../shared/shared.module';
import { DbVersion } from '../db-version/db-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chart, DbVersion]), SharedModule],
  controllers: [ChartController],
  providers: [ChartService],
})
export class ChartModule {}
