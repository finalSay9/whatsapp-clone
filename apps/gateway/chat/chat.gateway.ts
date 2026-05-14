import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayeConnection,
  OnGatewayeDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Inject, Logger, UnauthorizedException } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import Redis from "ioredis";
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from "@app/common";


@WebSocketGateway({
    cors: {
        origin: '*'
    },
    namespace: 'chat'
})
export class ChatGate
 implements OnGatewayInit, OnGatewayeConnection, OnGatewayeDisconnect {

    @WebSocketServer()
    server: Server;

    private logger = new Logger('ChatGatway')

    //track which userID maps to which socketID
    private userSocketMap = new Map<string, string>()

    constructor(
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
        @Inject('REDIS_CLIENT') private readonly redisClient: REDIS_CLIENT,
        @Inject('REDIS_SUBSCRIBER') private readonly redisSub: REDIS_SUBSCRIBER
    ){}

}