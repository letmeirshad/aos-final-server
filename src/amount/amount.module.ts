import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmountController } from './amount.controller';
import { Amount } from './amount.entity';
import { AmountService } from './amount.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Amount]), SharedModule],
  controllers: [AmountController],
  providers: [AmountService],
})
export class AmountModule {}
