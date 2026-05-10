import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),

    //register the auth service as the TCP CLIENT
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',//INJECT TOKEN
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001
        }

      }

    ])
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
