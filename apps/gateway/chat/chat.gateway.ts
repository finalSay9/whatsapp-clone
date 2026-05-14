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

    afterInit() {
        this.logger.log('Websocket Gateway Initialized')
        
        //subscribe to redis for incoming messages
        this.redisSub.Subscribe('new message', (err) => {
            if(err) this.logger.error('Redis subscribe error', err)
        });

        //when redis recieves a messages deliver it via websockets
        this.redisSub.on('message', (channell, message) => {
            if(channell == 'new message') {
                const data = JSON.parse(message);

        //find a receipient's socket and deliver
                const recipientSocketId = this.userSocketMap.get(data.recipientId)

                if(recipientSocketId) {
                    this.server
                    .to(recipientSocketId)
                    .emit('new message', data);
                this.logger.log(`message delivered to  ${data.recipientId}`)
                } else {
                    this.logger.log(`Recipient ${data.recipientId} is offline`);
                }
            }
        
        });    
    }

    //runs while clients connect
    async handleConnection(client: Socket) {
        //extract token from a handshake
        const token = client.handshake.auth?.token ||
         client.handshake.headers?.authourization.split(' ')[1]

         if(!token) {
            throw new UnauthorizedException('No Token Provided')
         }
    }

}