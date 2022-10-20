import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaanaController } from './paana.controller';
import { Paana } from './paana.entity';
import { PaanaService } from './paana.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Paana]), SharedModule],
  controllers: [PaanaController],
  providers: [PaanaService],
})
export class PaanaModule {}
