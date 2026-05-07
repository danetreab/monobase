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

  app.use(
    createProxyMiddleware({
      pathFilter: "/api/auth/**",
      target: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
      changeOrigin: true,
      xfwd: true,
    }),
  );

  app.use(
    createProxyMiddleware({
      pathFilter: "/graphql/**",
      target: process.env.GRAPHQL_SERVICE_URL ?? "http://localhost:3002",
      changeOrigin: true,
      xfwd: true,
      ws: true,
    }),
  );

  app.use(
    createProxyMiddleware({
      pathFilter: ["/graphql"],
      target: process.env.GRAPHQL_SERVICE_URL ?? "http://localhost:3002",
      changeOrigin: true,
      xfwd: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
