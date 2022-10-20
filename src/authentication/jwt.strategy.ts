import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticationService } from './authentication.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as fromShared from './../shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthenticationService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload) {
    const cust = await this.authService.checkCustomer(payload);
    const admin = await this.authService.checkAdmin(payload);
    const user = cust || admin;
    if (!user) {
      throw new UnauthorizedException(fromShared.compose('Unauthorized'));
    }
    return user;
  }
}
