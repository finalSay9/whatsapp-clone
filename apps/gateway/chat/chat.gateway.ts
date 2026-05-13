import {
  WebSockerServer,
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


@WebSocketGateway()