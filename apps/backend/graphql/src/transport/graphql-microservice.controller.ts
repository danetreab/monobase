import { Controller } from "@nestjs/common";
import { GraphQLSchemaHost } from "@nestjs/graphql";
import { MessagePattern, Payload } from "@nestjs/microservices";
import type { AuthPrincipal } from "@repo/auth-context";
import { graphql } from "graphql";
import { runWithAuth } from "../auth/auth-context.als";

// Auth is enforced by the gateway, which forwards the validated principal
// (see @repo/auth-context) so resolvers can read the caller's identity from
// contextValue. Both fields may be absent on the wire, hence Partial.
type ExecutePayload = {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
} & Partial<AuthPrincipal>;

@Controller()
export class GraphqlMicroserviceController {
  constructor(private readonly schemaHost: GraphQLSchemaHost) {}

  @MessagePattern("graphql.execute")
  async execute(@Payload() data: ExecutePayload) {
    const principal: AuthPrincipal = {
      user: data.user ?? null,
      session: data.session ?? null,
    };
    // Seed AsyncLocalStorage so services can read the caller via
    // getCurrentUser(); contextValue keeps resolver @Context() working too.
    return runWithAuth(principal, () =>
      graphql({
        schema: this.schemaHost.schema,
        source: data.query ?? "",
        variableValues: data.variables ?? undefined,
        operationName: data.operationName ?? undefined,
        contextValue: principal,
      }),
    );
  }
}
