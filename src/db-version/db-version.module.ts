import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbVersionController } from './db-version.controller';
import { DbVersion } from './db-version.entity';
import { DbVersionService } from './db-version.service';

@Module({
  imports: [TypeOrmModule.forFeature([DbVersion])],
  controllers: [DbVersionController],
  providers: [DbVersionService],
})
export class DbVersionModule {}
