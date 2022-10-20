import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MotorCombinationController } from './motor-comb.controller';
import { MotorCombination } from './motor-comb.entity';
import { MotorCombinationService } from './motor-comb.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([MotorCombination]), SharedModule],
  controllers: [MotorCombinationController],
  providers: [MotorCombinationService],
})
export class MotorCombinationModule {}
