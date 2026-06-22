import { Body, Controller, Inject, Post, Req, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import type { AuthSession, AuthUser } from "@repo/auth-context";
import type { Request } from "express";
import { firstValueFrom, timeout } from "rxjs";
import { AuthGuard } from "../auth/auth.guard";
import { GRAPHQL_CLIENT } from "./graphql.tokens";

type GraphqlRequest = {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
};

// AuthGuard populates these from the validated session before this controller
// forwards them to the graphql service (see @repo/auth-context).
type AuthedRequest = Request & {
  user?: AuthUser | null;
  session?: AuthSession | null;
};

@Controller("graphql/v1")
@UseGuards(AuthGuard)
export class GraphqlController {
  constructor(@Inject(GRAPHQL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  async execute(@Body() body: GraphqlRequest, @Req() req: AuthedRequest) {
    return firstValueFrom(
      this.client
        .send("graphql.execute", {
          query: body.query,
          variables: body.variables,
          operationName: body.operationName,
          // Pass the gateway-validated identity so resolvers can read it via
          // the GraphQL contextValue. The graphql service trusts these fields.
          user: req.user ?? null,
          session: req.session ?? null,
        })
        .pipe(timeout(15000)),
    );
  }
}
