import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SingleResultController } from './single-result.controller';
import { SingleResult } from './single-result.entity';
import { SingleResultService } from './single-result.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([SingleResult]), SharedModule],
  controllers: [SingleResultController],
  providers: [SingleResultService],
})
export class SingleResultModule {}
