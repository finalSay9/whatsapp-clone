import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Inject, Logger, UnauthorizedException, UseFilters } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import Redis from "ioredis";
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from '@app/common';
import { WsExceptionFilter } from "../exceptions/ws-exceptions.filter";
import { wsValidate } from "./dto/ws-validate.pipe";
import { SendMessageDto } from "./dto/send-message.dto";
import { JoinRoomDto } from "./dto/join-room.dto";





@UseFilters(WsExceptionFilter)
@WebSocketGateway({
  cors: {
    origin: "*", 
  },
  namespace: "chat", 
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger("ChatGateway");

  // track which userId maps to which socketId
  private userSocketMap = new Map<string, string>();

  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
    @Inject("MESSAGES_SERVICE") private readonly messagesClient: ClientProxy,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly redisSub: Redis,
  ) {}

  afterInit() {
    this.logger.log("WebSocket Gateway initialized");

    // subscribe to Redis channel for incoming messages
    this.redisSub.subscribe("new_message", (err) => {
      if (err) this.logger.error("Redis subscribe error", err);
    });

    // when Redis receives a message, deliver it via WebSocket
    this.redisSub.on("message", (channel, message) => {
      if (channel === "new_message") {
        const data = JSON.parse(message);

        // find recipient's socket and deliver
        const recipientSocketId = this.userSocketMap.get(data.recipientId);
        if (recipientSocketId) {
          this.server.to(recipientSocketId).emit("new_message", data);
          this.logger.log(`Message delivered to ${data.recipientId}`);
        } else {
          this.logger.log(`Recipient ${data.recipientId} is offline`);
        }
      }
    });
  }

  // runs when a client connects
  async handleConnection(client: Socket) {
    try {
      // 1. extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        throw new UnauthorizedException("No token provided");
      }

      // 2. verify token with Auth Service over TCP
      const result = await firstValueFrom(
        this.authClient.send({ cmd: "verify_token" }, { token }),
      );

      if (!result.valid) {
        throw new UnauthorizedException("Invalid token");
      }

      // 3. attach user to socket
      client.data.user = result.payload;
      const userId = result.payload.sub;

      // 4. track the connection
      this.userSocketMap.set(userId, client.id);

      // 5. publish online status to Redis
      await this.redisClient.set(`presence:${userId}`, "online");
      await this.redisClient.publish(
        "presence",
        JSON.stringify({ userId, status: "online" }),
      );

      this.logger.log(`Client connected: ${userId} (socket: ${client.id})`);
      client.emit("connected", { message: "Successfully connected" });
    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt — disconnecting`);
      client.disconnect();
    }
  }

  // runs when a client disconnects
  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;

    if (userId) {
      // remove from socket map
      this.userSocketMap.delete(userId);

      // update presence in Redis
      await this.redisClient.set(
        `presence:${userId}`,
        Date.now().toString(), // store last seen timestamp
      );

      await this.redisClient.publish(
        "presence",
        JSON.stringify({ userId, status: "offline" }),
      );

      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  // handles 'sendMessage' events from clients
  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    //validate the data
    const dto = await wsValidate(SendMessageDto, data)


    const sender = client.data.user;

    // 1. save message to database first
    const saved = await firstValueFrom(
      this.messagesClient.send({ cmd: "save_message" },
        {
          content: dto.content,
          senderId: sender.sub,
          recipientId: dto.recipientId,
        },
      ),
    );

    const message = {
      ...saved.data,
      senderId: sender.sub,
      senderEmail: sender.email,
      recipientId: dto.recipientId,
      content:dto.content,
      timestamp: new Date().toISOString(),
    };

    // publish to Redis — any gateway instance will pick this up
    await this.redisClient.publish("new_message", JSON.stringify(message));

    this.logger.log(`Message from ${sender.sub} to ${dto.recipientId}`);

    // confirm to sender
    return { status: "sent", timestamp: message.timestamp };
  }

  // handles 'joinRoom' events — for group chats later
  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    //validate the room id
    const dto = await wsValidate(JoinRoomDto, data);

    client.join(dto.roomId);
    this.logger.log(`${client.data.user?.sub} joined room ${dto.roomId}`);
    return { status: "joined", roomId: dto.roomId };
  }

  // handles typing indicator events
  @SubscribeMessage("typing")
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { recipientId: string; isTyping: boolean },
  ) {
    const recipientSocketId = this.userSocketMap.get(data.recipientId);

    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit("typing", {
        userId: client.data.user.sub,
        isTyping: data.isTyping,
      });
    }
  }

  // helper method — other services can call this to send to a specific user
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true; // user is online
    }
    return false; // user is offline
  }
}
