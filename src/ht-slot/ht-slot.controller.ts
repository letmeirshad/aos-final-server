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
import { HTSlotService } from './ht-slot.service';
import { HTSlotDTO, InitialDataDTO } from './ht-slot.dto';
import { Response } from 'express';
import * as fromShared from '../shared';
import { classToPlain } from 'class-transformer';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth, ApiConsumes, ApiHeader } from '@nestjs/swagger';

@Controller('ht-slot')
export class HTSlotController {
  constructor(private readonly slotService: HTSlotService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/initial-data')
  @ApiBearerAuth()
  async create(@Body() data: InitialDataDTO, @Res() res: Response) {
    try {
      const initialDat = await this.slotService.initialData(data);
      return fromShared.saved(res, initialDat);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating paana'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/details')
  async update(@Body() slotData: HTSlotDTO, @Res() res: Response) {
    try {
      const data = await this.slotService.findSlot(slotData);
      return fromShared.saved(res, data);
    } catch (error) {
      throw new BadRequestException('Error in updating Role');
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async findAll(@Res() res: Response) {
    try {
      const amounts = classToPlain(await this.slotService.findAll());
      return fromShared.found(res, amounts);
    } catch (error) {
      throw new BadRequestException('Error in finding Roles');
    }
  }
}
