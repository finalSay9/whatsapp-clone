import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  //gateway sends : new message
  @MessagePattern({cmd : 'new message'})
  message(@Payload() data: {content: string; senderId: string; recipientId: string}) {
    return this.messagesService.createMessage(data)

  }
}
