import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus ? exception.getStatus() : 400;

    response.status(status).json({
      statusCode: status,
      statusMessage: 'FAILED',
      error:
        exception.response && exception.response.message
          ? exception.response.message
          : exception,
    });
    response.credentials = '';
  }
}
