import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { createProxyMiddleware } from "http-proxy-middleware";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["http://localhost:5173"],
    credentials: true,
  });

  // Auth still goes over HTTP — better-auth requires HTTP semantics
  // (cookies, OAuth redirects). Proxy /api/auth/* straight through.
  app.use(
    createProxyMiddleware({
      pathFilter: "/api/auth/**",
      target: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
      changeOrigin: true,
      xfwd: true,
    }),
  );

  // /graphql is no longer HTTP-proxied. It's handled by GraphqlController,
  // which forwards the query to the graphql service over Redis transport.

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
