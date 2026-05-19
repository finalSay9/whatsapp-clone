import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // figure out what kind of exception this is
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again later.';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string'
        ? res
        : (res as any).message || message;
    }

    // log the real error internally — never expose to client
    this.logger.error('Unhandled exception:', exception);

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}