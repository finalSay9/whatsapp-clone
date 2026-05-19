import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { RpcException } from '@nestjs/microservices';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private logger = new Logger('WsExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'Something went wrong';
    let statusCode = 500;

    if (exception instanceof WsException) {
      const error = exception.getError();
      message = typeof error === 'string' ? error : (error as any).message;
    } else if (exception instanceof RpcException) {
      const error = exception.getError() as any;
      message = error?.message || message;
      statusCode = error?.statusCode || statusCode;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`WebSocket error for ${client.id}: ${message}`);

    // send error event back to the specific client
    client.emit('error', {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}