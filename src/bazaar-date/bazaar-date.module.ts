import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BazaarDateController } from './bazaar-date.controller';
import { BazaarDate } from './bazaar-date.entity';
import { BazaarDateService } from './bazaar-date.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([BazaarDate]), SharedModule],
  controllers: [BazaarDateController],
  providers: [BazaarDateService],
})
export class BazaarDateModule {}
