import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HTAdminLedgerController } from './ht-admin-ledger.controller';
import { HTAdminLedger } from './ht-admin-ledger.entity';
import { HTAdminLedgerService } from './ht-admin-ledger.service';
import { SharedModule } from '../shared/shared.module';
import { Admin } from '../admin/admin.entity';
import { HTConfig } from '../ht-config/ht-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HTAdminLedger, Admin, HTConfig]),
    SharedModule,
  ],
  controllers: [HTAdminLedgerController],
  providers: [HTAdminLedgerService],
})
export class HTAdminLedgerModule {}
