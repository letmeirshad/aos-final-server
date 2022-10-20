import { HttpModule, Module } from '@nestjs/common';
import * as filters from './filters';
import * as services from './services';

@Module({
  imports: [filters.ExceptionsFilter, HttpModule],
  controllers: [],
  providers: [
    services.HashingService,
    services.PaginationService,
    services.ImageService,
    services.ExcelService,
  ],
  exports: [
    filters.ExceptionsFilter,
    services.HashingService,
    services.PaginationService,
    services.ImageService,
    services.ExcelService,
    HttpModule
  ],
})
export class SharedModule {}
