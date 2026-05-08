import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import type { Request, Response } from "express";
import { DbModule } from "./db/db.module";
import { PostsModule } from "./posts/posts.module";
import { GraphqlMicroserviceController } from "./transport/graphql-microservice.controller";
import { UsersModule } from './admin/users/users.module';

@Module({
  imports: [
    DbModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "schema.gql"),
      playground: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
    PostsModule,
    UsersModule,
  ],
  controllers: [GraphqlMicroserviceController],
})
export class AppModule {}
