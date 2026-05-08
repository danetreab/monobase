import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { redisOptionsFromUrl } from "@repo/redis-config";
import { GraphqlController } from "./graphql.controller";
import { GRAPHQL_CLIENT } from "./graphql.tokens";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: GRAPHQL_CLIENT,
        transport: Transport.REDIS,
        options: redisOptionsFromUrl(process.env.REDIS_URL ?? "redis://localhost:6379"),
      },
    ]),
  ],
  controllers: [GraphqlController],
})
export class GraphqlModule {}
