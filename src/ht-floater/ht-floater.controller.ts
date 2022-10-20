import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FloaterService } from './ht-floater.service';
import { FloaterUpdateDTO } from './ht-floater.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('ht-floater')
export class HTFloaterController {
  constructor(private readonly floaterService: FloaterService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/save')
  async create(@Res() res: Response) {
    try {
      await this.floaterService.save();
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating paana'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update')
  async update(@Body() floater: FloaterUpdateDTO, @Res() res: Response) {
    try {
      await this.floaterService.update(floater);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException('Error in updating Role');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async findAll(@Res() res: Response) {
    try {
      const amounts = classToPlain(await this.floaterService.findAll());
      return fromShared.found(res, amounts);
    } catch (error) {
      throw new BadRequestException('Error in finding Roles');
    }
  }
}
