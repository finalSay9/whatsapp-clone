import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { JwtGuard } from '../guards/guard.jwt';
import { ChatGateway } from '../chat/chat.gateway';
import { RedisModule } from '@app/common/redis/redis.module';





@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    RedisModule,

    //register the auth service as the TCP CLIENT
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',//INJECT TOKEN
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3006
        }
      }
    ])
  ],
  controllers: [GatewayController],
  providers: [GatewayService, JwtGuard, ChatGateway],
})
export class GatewayModule {}
