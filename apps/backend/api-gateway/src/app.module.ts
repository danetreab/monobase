import { Module } from "@nestjs/common";
import { HealthController } from "./v1/health.controller";
import { ItemsController } from "./v1/items.controller";
import { UsersController } from "./v1/users.controller";

@Module({
  controllers: [HealthController, ItemsController, UsersController],
})
export class AppModule {}
