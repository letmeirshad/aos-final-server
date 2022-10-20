import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminLedgerController } from './admin-ledger.controller';
import { AdminLedger } from './admin-ledger.entity';
import { AdminLedgerService } from './admin-ledger.service';
import { SharedModule } from '../shared/shared.module';
import { Admin } from '../admin/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminLedger, Admin]), SharedModule],
  controllers: [AdminLedgerController],
  providers: [AdminLedgerService],
})
export class AdminLedgerModule {}
