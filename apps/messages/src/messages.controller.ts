import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  //gateway sends : new message
  @MessagePattern({ cmd: "save_message" })
  message(
    @Payload() data: { content: string; senderId: string; recipientId: string },
  ) {
    return this.messagesService.createMessage(data);
  }

  // 👇 add these two patterns
  @MessagePattern({ cmd: "get_messages" })
  getMessages(@Payload() data: { userId: string; recipientId: string }) {
    return this.messagesService.getMessages(data);
  }

  
}
