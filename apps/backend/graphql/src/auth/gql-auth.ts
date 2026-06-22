import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  createParamDecorator,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { type AuthSession, type AuthUser, isAdmin } from "@repo/auth-context";

// Shape of the GraphQL contextValue once the gateway-forwarded principal has
// been placed on it (see transport/graphql-microservice.controller.ts). Reuse
// this type anywhere you reach for `@Context()` directly.
export type GqlAuthContext = {
  user: AuthUser | null;
  session: AuthSession | null;
};

function authContext(ctx: ExecutionContext): GqlAuthContext {
  return GqlExecutionContext.create(ctx).getContext<GqlAuthContext>();
}

// Param decorators — the easy path for resolvers:
//   myQuery(@CurrentUser() user: AuthUser | null) { ... }
//   myQuery(@CurrentSession() session: AuthSession | null) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null =>
    authContext(ctx).user ?? null,
);

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession | null =>
    authContext(ctx).session ?? null,
);

// Declarative guard — the easy path for whole resolvers/mutations:
//   @UseGuards(AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    if (!isAdmin(authContext(ctx).user?.role)) {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}

// Imperative check — for when a single method needs it inline rather than a
// guard on the whole resolver.
export function requireAdmin(ctx: GqlAuthContext): void {
  if (!isAdmin(ctx.user?.role)) {
    throw new ForbiddenException("Admin access required");
  }
}
