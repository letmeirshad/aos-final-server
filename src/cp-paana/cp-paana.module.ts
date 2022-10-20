import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpPaanaController } from './cp-paana.controller';
import { CpPaana } from './cp-paana.entity';
import { CpPaanaService } from './cp-paana.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([CpPaana]), SharedModule],
  controllers: [CpPaanaController],
  providers: [CpPaanaService],
})
export class CpPaanaModule {}
