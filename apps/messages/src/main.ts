import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { MessagesModule } from './messages.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MessagesModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3009
      }
    }
  );



  await app.listen();
  console.log('message microservice listening on port 3009')
}
bootstrap();
