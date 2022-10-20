import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from './configuration.service';
import { ConfigurationDTO } from './configuration.dto';
import { Response } from 'express';
import * as fromShared from '../shared';

import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('configuration')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post('/new')
  async new(@Res() res: Response, @Body() req: ConfigurationDTO) {
    try {
      await this.configService.new(req);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating configuration'),
      );
    }
  }

  @Post('/update')
  async update(@Res() res: Response, @Body() req: ConfigurationDTO) {
    try {
      await this.configService.update(req);
      return fromShared.saved(res);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating configuration'),
      );
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const amounts = await this.configService.findAll();
      return fromShared.found(res, amounts);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in finding Amounts'),
      );
    }
  }
}
