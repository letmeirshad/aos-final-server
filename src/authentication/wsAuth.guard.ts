import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { AuthenticationService } from './authentication.service';
import * as fromShared from './../shared';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthenticationService) {}
  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const cookies: string[] = client.handshake.headers.cookie.split('; ');
    const authToken = cookies
      .find(cookie => cookie.startsWith('jwt'))
      .split('=')[1];
    const uiuasd = authToken.substr(0, authToken.length - 1);
    const jwtPayload = jwt.verify(uiuasd, process.env.JWT_SECRET);
    const cust = await this.authService.checkCustomer(jwtPayload);
    const admin = await this.authService.checkAdmin(jwtPayload);
    const user = cust || admin;
    if (!user) {
      throw new WsException(fromShared.compose('Unauthorized'));
    } else {
      return true;
    }
  }
}
