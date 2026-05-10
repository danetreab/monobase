import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export interface AuthedUser {
  id: string;
  email: string;
  role: string | null;
}

// Reads the validated identity that the gateway forwards via the TCP payload
// and injects into Apollo's `contextValue` (see graphql-microservice.controller).
// Throws if absent — mutations that need an owning user shouldn't run anonymously.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthedUser => {
    const ctx = GqlExecutionContext.create(context).getContext<{
      user?: AuthedUser | null;
    }>();
    if (!ctx.user) {
      throw new UnauthorizedException("No authenticated user in GraphQL context");
    }
    return ctx.user;
  },
);
