import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<any> {
    const can = await super.canActivate(context);
    const request = context.switchToHttp().getRequest();
    if (can) {
      if (request.user.admin_id) {
        super.logIn(request);
      }
    }
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw new UnauthorizedException('Error in authorizing');
    }

    if (user.cust_id) {
    }
    return user;
  }
}
