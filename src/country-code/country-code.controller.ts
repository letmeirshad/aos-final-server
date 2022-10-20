import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Get,
} from '@nestjs/common';
import { CountryCodeService } from './country-code.service';
import * as fromShared from '../shared';
import { ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { Response } from 'express';

import { ApiBearerAuth } from '@nestjs/swagger';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('country-code')
export class CountryCodeController {
  constructor(private readonly codeService: CountryCodeService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/new')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function(req, file, cb) {
          cb(null, './spreadsheet/');
        },
        filename: function(req, file, cb) {
          cb(null, `countrycode${extname(file.originalname)}`);
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
      await this.codeService.save('./' + file.path);
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

  @Get()
  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  async getCode(@Res() res: Response) {
    try {
      const allCodes = await this.codeService.getCode();
      return fromShared.found(res, allCodes);
    } catch (er) {
      throw new BadRequestException(
        fromShared.formatError(er, 'Error in finding codes'),
      );
    }
  }
}
