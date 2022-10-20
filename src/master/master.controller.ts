import {
  Controller,
  Get,
  BadRequestException,
  Res,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MasterService } from './master.service';
import * as fromShared from '../shared';
import { Response } from 'express';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth, ApiTags, ApiBody, ApiProperty } from '@nestjs/swagger';

import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// @ApiTags('Master Data')

class FileUploadDTO {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

@Controller('master')
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  @Post('/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDTO,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function(req, file, cb) {
          cb(null, './spreadsheet/');
        },
        filename: function(req, file, cb) {
          cb(null, `master${extname(file.originalname)}`);
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
      await this.masterService.save('./' + file.path);
      return {
        statusCode: 200,
        statusMessage: 'SUCCESS',
        message: 'Uploaded Successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating paana'),
      );
    }
  }

  @Post('/save-apk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function(req, file, cb) {
          cb(null, './apk/');
        },
        filename: function(req, file, cb) {
          cb(null, `asonline${extname(file.originalname)}`);
        },
        fileFilter: function(req, file, cb) {
          if (extname(file.originalname) !== 'apk') {
            throw fromShared.compose('Only .apk files are allowed');
          }
        },
      }),
      limits: {
        files: 1,
      },
    }),
  )
  async saveApk(@UploadedFile() file) {
    try {
      await this.masterService.saveApk('./' + file.path);
      return {
        statusCode: 200,
        statusMessage: 'SUCCESS',
        message: 'Uploaded Successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in uploading apk'),
      );
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const masterData = await this.masterService.find();
      return fromShared.found(res, masterData);
    } catch (error) {
      throw new BadRequestException('Error in getting master data');
    }
  }
}
