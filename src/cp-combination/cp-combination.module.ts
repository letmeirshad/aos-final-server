import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpCombinationController } from './cp-combination.controller';
import { CpCombination } from './cp-combination.entity';
import { CpCombinationService } from './cp-combination.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([CpCombination]), SharedModule],
  controllers: [CpCombinationController],
  providers: [CpCombinationService],
})
export class CpCombinationModule {}
