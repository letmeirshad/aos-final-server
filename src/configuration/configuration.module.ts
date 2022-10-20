import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigController } from './configuration.controller';
import { Configuration } from './configuration.entity';
import { ConfigService } from './configuration.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Configuration]), SharedModule],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigurationModule {}
