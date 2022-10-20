import {
  Controller,
  Get,
  Res,
  BadRequestException,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ChartService } from './chart.service';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadDTO } from './chart.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const paanas = classToPlain(await this.chartService.findAll());
      return fromShared.found(res, paanas);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Charts'),
      );
    }
  }

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
          cb(null, `chartdetails${extname(file.originalname)}`);
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
      await this.chartService.save('./' + file.path);
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
}
