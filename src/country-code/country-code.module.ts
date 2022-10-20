import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalService } from '../shared';
import { SharedModule } from '../shared/shared.module';
import { CountryCode } from './country-code.entity';
import { CountryCodeService} from './country-code.service';
import { CountryCodeController } from './country-code.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CountryCode]), SharedModule],
    providers: [CountryCodeService, ExternalService],
  controllers: [CountryCodeController],

})
export class CountryCodeModule {}

