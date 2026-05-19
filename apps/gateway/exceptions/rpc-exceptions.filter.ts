import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  private logger = new Logger('RpcExceptionFilter');

  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // extract the error object from RpcException
    const error = exception.getError() as {
      statusCode: number;
      message: string;
    };

    const statusCode = error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error?.message || 'Internal server error';

    this.logger.error(`RPC Error: ${message} (${statusCode}) on ${request.url}`);

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}