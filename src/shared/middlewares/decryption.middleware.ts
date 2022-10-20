import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor() {}
  async use(req: Request, res: Response, next: Function) {
    try {
      // if (req.baseUrl !== '/auth/uuid-key' && req.baseUrl !== '/admins/save') {
      //   req.body = Object.keys(req.body).length !== 0  ? await this.securityService.decrypt(req.body) : req.body;
      // }
      next();
    } catch (e) {
      throw new BadRequestException('Error occured');
    }
  }
}
