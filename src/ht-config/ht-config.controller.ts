import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HTCongigService } from './ht-config.service';
import { HTConfigDTO } from './ht-config.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('ht-config')
export class HTConfigController {
  constructor(private readonly configService: HTCongigService) {}

 
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update')
  async update(@Body() config: HTConfigDTO, @Res() res: Response) {
    try {
      await this.configService.update(config);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException('Error in updating ht configuration');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async findAll(@Res() res: Response) {
    try {
      const amounts = classToPlain(await this.configService.findAll());
      return fromShared.found(res, amounts);
    } catch (error) {
      throw new BadRequestException('Error in finding configuration');
    }
  }
}
