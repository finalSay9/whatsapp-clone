import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      
    })
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
