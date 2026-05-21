// apps/messages/src/messages.service.ts
import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { PrismaService } from "@app/common";
import { PaginationDto } from "../dto/pagination.dto";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    content: string;
    senderId: string;
    recipientId: string;
  }) {
    try {
      const message = await this.prisma.message.create({
        data: {
          content: data.content,
          senderId: data.senderId,
          recipientId: data.recipientId,
        },
      });

      return {
        message: "Message sent successfully",
        data: message,
      };
    } catch (error) {
      // 👇 catch unexpected database errors and wrap them
      throw new RpcException({
        statusCode: 500,
        message: "Failed to save message",
      });
    }
  }
//fetching the messages FROM A to B and B to A
  async getMessages(
    data: { userId: string; recipientId: string },
    paginationDto: PaginationDto) {
      
    try {
      const {page, limit} = paginationDto;
      const skip = (page -1) * limit
      const [messages,total] = await Promise.all([
        this.prisma.message.findMany({
          where: {
            OR: [
              { senderId: data.userId, recipientId: data.recipientId},
              { senderId: data.recipientId, recipientId: data.userId }
            ]
          },
          orderBy: { createdAt: "asc" },
          skip: skip,
          take: limit,
        }),
        this.prisma.message.count({
          where: {
            OR: [
              { senderId: data.userId, recipientId: data.recipientId},
              { senderId: data.recipientId, recipientId: data.userId }
            ]
          }
        })
      ])
      return {
        data: messages,
        meta: {
          totalItems: total,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page || 1
        }

      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: "Failed to fetch messages",
      });
    }
  }

  async markAsRead(data: { senderId: string; recipientId: string }) {
    try {
      await this.prisma.message.updateMany({
        where: {
          senderId: data.senderId,
          recipientId: data.recipientId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: "Failed to mark messages as read",
      });
    }
  }
}
