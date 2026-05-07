import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";

type SessionResponse = {
  session?: { id: string; userId: string; expiresAt: string };
  user?: { id: string; email: string; role: string | null };
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly authServiceUrl =
    process.env.AUTH_SERVICE_URL ?? "http://localhost:3001";

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext<{ req: Request }>().req;

    // Apollo Studio / Playground introspection runs before any user is signed in.
    // Skip auth for it so the schema explorer remains usable in dev.
    const query = (req.body as { query?: string } | undefined)?.query;
    if (query && (query.includes("IntrospectionQuery") || /__schema|__type\b/.test(query))) {
      return true;
    }

    const cookie = req.headers.cookie;
    if (!cookie) {
      throw new UnauthorizedException("Missing session cookie");
    }

    const res = await fetch(`${this.authServiceUrl}/api/auth/get-session`, {
      headers: { cookie },
    });

    if (!res.ok) {
      this.logger.warn(`Auth service responded ${res.status}`);
      throw new UnauthorizedException("Session validation failed");
    }

    const data = (await res.json()) as SessionResponse;
    if (!data?.session) {
      throw new UnauthorizedException("No active session");
    }

    // Make session/user available to resolvers via @Context()
    const ctx = gqlCtx.getContext<{ user?: SessionResponse["user"]; session?: SessionResponse["session"] }>();
    ctx.user = data.user;
    ctx.session = data.session;
    return true;
  }
}
