import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  Session,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AdminAuth, CustAuth, LogOut } from './authentication.dto';
import { Response, Request } from 'express';
import * as fromShared from '../shared';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';
import { ApiHeader } from '@nestjs/swagger';
import { CustomerDTO } from '../customer/customer.dto';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  @Post('/signup')
  async signup(@Body() customer: CustomerDTO, @Res() res: Response) {
    try {
      const updatedPoints = await this.authenticationService.newCustomer(
        customer,
      );
      return fromShared.saved(res, updatedPoints);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in creating new customer'),
      );
    }
  }

  @Post('/login')
  async create(@Body() auth: CustAuth, @Res() res: Response) {
    try {
      const authenticated = await this.authenticationService.login(auth);
      return fromShared.authenticated(res, authenticated);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in authentication'),
      );
    }
  }

  @Post('/uuid-key')
  async getPublicKey(@Res() res: Response) {
    try {
      const publicKey = await this.authenticationService.getPublicKey();
      return fromShared.success(res, '', publicKey);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting key'),
      );
    }
  }

  @Post('/admin/login')
  async login(
    @Body() auth: AdminAuth,
    @Res() res: Response,
    @Session() session,
  ) {
    try {
      const authenticated = await this.authenticationService.adminLogin(auth);
      return fromShared.authenticated(res, authenticated);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in authentication'),
      );
    }
  }

  @Post('/customer/logout')
  async logout(@Body() logout: LogOut, @Res() res: Response) {
    try {
      await this.authenticationService.customerLogout(logout);
      return fromShared.success(res, 'Successfully Logged Out');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in authentication'),
      );
    }
  }

  @Post('/admin/logout')
  async adminLogout(@Res() res: Response, @Req() req: Request) {
    try {
      await this.authenticationService.adminLogout(req);
      return fromShared.success(res, 'Successfully Logged Out');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in authentication'),
      );
    }
  }
}
