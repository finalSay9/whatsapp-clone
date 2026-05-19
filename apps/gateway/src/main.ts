import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RpcExceptionFilter } from '../exceptions/rpc-exceptions.filter';
import { AllExceptionsFilter } from '../exceptions/all-exeptions.filter';


async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.enableCors({
    origin: "*",
    methods: ["GET", "POST"],
  });

  // apply filters in order — most specific first, catch-all last
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new RpcExceptionFilter(), 
  );

  //validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("WhatsApp Clone API")
    .setDescription("API Gateway — all requests go through here")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "access-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3007);
  console.log("Gateway running on http://localhost:3007");
  console.log("Swagger docs at http://localhost:3007/api/docs");
}
bootstrap();
