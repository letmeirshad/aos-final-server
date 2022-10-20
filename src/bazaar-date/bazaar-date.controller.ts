import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { BazaarDateService } from './bazaar-date.service';
import { BazaarDateDTO, MonthDTO } from './bazaar-date.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bazaar-date')
export class BazaarDateController {
  constructor(private readonly bazaarDateService: BazaarDateService) {}

  @Post('/new')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function(req, file, cb) {
          cb(null, './spreadsheet/');
        },
        filename: function(req, file, cb) {
          cb(null, `bazaardate${extname(file.originalname)}`);
        },
        fileFilter: function(req, file, cb) {
          if (extname(file.originalname) !== 'xlxs') {
            throw fromShared.compose('Only .xlxs files are allowed');
          }
        },
      }),
      limits: {
        files: 1,
      },
    }),
  )
  async create(@UploadedFile() file) {
    try {
      await this.bazaarDateService.save('./' + file.path);
      return {
        statusCode: 200,
        statusMessage: 'SUCCESS',
        message: 'Uploaded Successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in saving bazaar dates'),
      );
    }
  }

  @Post()
  async findBazaarMonth(@Res() res: Response, @Body() month: MonthDTO) {
    try {
      const bazaarDates = classToPlain(
        await this.bazaarDateService.findAll(month),
      );
      return fromShared.found(res, bazaarDates);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bazaar dates'),
      );
    }
  }

  @Post('/update')
  async updateBazaarDate(
    @Res() res: Response,
    @Body() bazaarDate: BazaarDateDTO,
  ) {
    try {
      await this.bazaarDateService.update(bazaarDate);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating bazaar dates'),
      );
    }
  }
}
