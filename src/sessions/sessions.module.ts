import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './sessions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
})
export class SessionsModule {}
