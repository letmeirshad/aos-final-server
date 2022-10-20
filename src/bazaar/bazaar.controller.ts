import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { BazaarService } from './bazaar.service';
import { BazaarDTO, BazaarId, SingleBazaarDate } from './bazaar.dto';
import { Response } from 'express';
import * as fromShared from './../shared';
import { classToPlain } from 'class-transformer';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('bazaar')
export class BazaarController {
  constructor(private readonly bazaarService: BazaarService) {}

  @Post('/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function(req, file, cb) {
          cb(null, './spreadsheet/');
        },
        filename: function(req, file, cb) {
          cb(null, `bazaardetails${extname(file.originalname)}`);
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
      await this.bazaarService.save('./' + file.path);
      return {
        statusCode: 200,
        statusMessage: 'SUCCESS',
        message: 'Uploaded Successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in saving bazaar'),
      );
    }
  }

  @Post('/save-games')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: function(req, file, cb) {
          cb(null, './spreadsheet/');
        },
        filename: function(req, file, cb) {
          cb(null, `bazaargame${extname(file.originalname)}`);
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
  async save(@UploadedFile() file) {
    try {
      await this.bazaarService.saveGame('./' + file.path);
      return {
        statusCode: 200,
        statusMessage: 'SUCCESS',
        message: 'Uploaded Successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in saving bazaar game map'),
      );
    }
  }

  @Post('/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateBazaar(@Body() body: BazaarDTO, @Res() res) {
    try {
      await this.bazaarService.update(body);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating bazaar'),
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Res() res: Response) {
    try {
      const bazaars = classToPlain(await this.bazaarService.findAll());
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bazaar details'),
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAllByDate(@Res() res: Response, @Body() req: SingleBazaarDate) {
    try {
      const bazaars = classToPlain(await this.bazaarService.findAll(req));
      return fromShared.found(res, bazaars);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bazaar details'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/timing')
  async findTiming(@Res() res: Response, @Body() req: BazaarId) {
    try {
      const bazaarTiming = await this.bazaarService.findTimeById(req.id);
      return fromShared.found(res, {
        remaining_time: bazaarTiming.remaining_time,
      });
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding bazaar timing'),
      );
    }
  }
}
