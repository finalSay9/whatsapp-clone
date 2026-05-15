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

         //verify token with auth over tcp
         const result = await firstValueFrom(
            this.authClient.send({cmd: 'verify_token'}, {token})
         )

         if (!result.valid) {
           throw new UnauthorizedException("Invalid token");
         }

         //attach user to socket
         client.user.data = result.payload
         const userId = result.payload.Sub

         //track the connection
         this.userSocketMap.set(userId, client.id)

         //publish online status to redis
         await this.redisClient.set(`presence:${userId}`, 'online');
         await this.redisClient.publish(
            'presence',
            JSON.stringify({userId, status: 'online'}),
         );
           this.logger.log(`Client connected: ${userId} (socket: ${client.id})`);
      client.emit('connected', { message: 'Successfully connected' });

    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt — disconnecting`);
      client.disconnect();
    }
    }
      // runs when a client disconnects
    async handleDisconnect(client: Socket) {
        const userId = client.data.user?.sub
        
        iff (userId) {
      // remove from socket map
      this.userSocketMap.delete(userId);

      // update presence in Redis
      await this.redisClient.set(
        `presence:${userId}`,
        Date.now().toString(), // store last seen timestamp
      );
    }

}