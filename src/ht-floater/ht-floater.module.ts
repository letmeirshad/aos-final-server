import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HTFloaterController } from './ht-floater.controller';
import { HTFloater } from './ht-floater.entity';
import { FloaterService } from './ht-floater.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([HTFloater]), SharedModule],
  controllers: [HTFloaterController],
  providers: [FloaterService],
})
export class HTFloaterModule {}
