// libs/common/src/redis/redis.module.ts
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";
export const REDIS_SUBSCRIBER = "REDIS_SUBSCRIBER";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_SUBSCRIBER,
      useFactory: (config: ConfigService) => {
        // separate connection for subscribing
        // Redis requires a dedicated connection for pub/sub
        return new Redis({
          host: config.get("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, REDIS_SUBSCRIBER],
})
export class RedisModule {}
