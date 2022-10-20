import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { GameService } from './game.service';
import { GameAmountDTO, FileUploadDTO, GameStatusDTO } from './game.dto';
import { Response } from 'express';
import * as fromShared from './../shared';
import { classToPlain } from 'class-transformer';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../authentication/auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('game')
export class GameController {
  constructor(private readonly gameRepository: GameService) {}

  @Post('/save')
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
          cb(null, `games${extname(file.originalname)}`);
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
      await this.gameRepository.save('./' + file.path);
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

  @Post('/save-amount')
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
          cb(null, `gamesamount${extname(file.originalname)}`);
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
  async saveAmount(@UploadedFile() file) {
    try {
      await this.gameRepository.saveAmount('./' + file.path);
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

  @Post('/update-amount')
  async updateAmount(@Body() gameAmount: GameAmountDTO, @Res() res: Response) {
    try {
      await this.gameRepository.updateAmount(gameAmount);
      return fromShared.saved(res, 'Sucessfully updated');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating game amounts'),
      );
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const games = classToPlain(await this.gameRepository.findAll());
      return fromShared.found(res, games);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding games'),
      );
    }
  }

  @Post('/update-status')
  async updateStatus(@Res() res: Response, @Body() body: GameStatusDTO) {
    try {
      await this.gameRepository.updateStatus(body);
      return fromShared.success(res, 'Game status changed');
    } catch (er) {
      throw new BadRequestException(
        fromShared.formatError(er, 'Error in updating game status'),
      );
    }
  }
}
