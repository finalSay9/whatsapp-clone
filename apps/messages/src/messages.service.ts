import { Injectable } from "@nestjs/common";
import { PrismaService } from "@app/common";


@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    content: string;
    senderId: string;
    recipientId: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        recipientId: data.recipientId,
      },
    });

    return {
      message: "message sent successfully",
      data: message,
    };
  }
}
