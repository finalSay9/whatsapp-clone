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

  //fetch conversation history between two users
  async getMessages(data: {userId: string; recipientId: string}) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          //MESSAGES A SENT TO B
          { senderId: data.userId, recipientId: data.recipientId },
          //messages b to a
          { senderId: data.recipientId, recipientId: data.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
      return messages;
  }
}
