import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HTConfigController } from './ht-config.controller';
import { HTConfig } from './ht-config.entity';
import { HTCongigService } from './ht-config.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([HTConfig]), SharedModule],
  controllers: [HTConfigController],
  providers: [HTCongigService],
})
export class HTConfigModule {}
