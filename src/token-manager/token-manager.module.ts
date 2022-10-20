import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalService } from '../shared';
import { SharedModule } from '../shared/shared.module';
import { TokenManager } from './token-manager.entity';
import { TokenManagerService} from './token-manager.service';

@Module({
    imports: [TypeOrmModule.forFeature([TokenManager]), SharedModule],
    providers: [TokenManagerService, ExternalService]
})
export class TokenManagerModule {}

