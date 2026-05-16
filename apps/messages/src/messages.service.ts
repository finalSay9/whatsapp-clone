import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@app/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async createMessage(data: {
    content: string;
    senderId: string;
    recipientId: string;
  }) {
    const message = await this.prisma.messages.create({
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
