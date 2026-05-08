import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";
import { redisOptionsFromUrl } from "@repo/redis-config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: redisOptionsFromUrl(process.env.REDIS_URL ?? "redis://localhost:6379"),
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
