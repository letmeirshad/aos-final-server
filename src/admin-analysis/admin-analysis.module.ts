import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAnalysis } from './admin-analysis.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAnalysis]), SharedModule],
  controllers: [],
  providers: [],
})
export class AdminAnalysisModule {}
