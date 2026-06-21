import { ForbiddenException } from "@nestjs/common";
import { Args, Context, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CrudResolver } from "../../lib/nestjs-query-drizzle";
import { AcceptInviteInput } from "./dto/accept-invite.input";
import { CreateAdminUserInput } from "./dto/create-admin-user.input";
import { CreateUserResult } from "./dto/create-user-result.dto";
import { GenerateInviteResult } from "./dto/generate-invite-result.dto";
import { InviteInfoDto } from "./dto/invite-info.dto";
import { UserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

type GqlContext = { user: { id: string; role: string | null } | null };

function requireAdmin(ctx: GqlContext) {
  if (!ctx.user?.role?.includes("admin")) {
    throw new ForbiddenException("Admin access required");
  }
}

@Resolver(() => UserDto)
export class UsersResolver extends CrudResolver({
  DTOClass: UserDto,
  enableSubscriptions: true,
}) {
  constructor(private readonly users: UsersService) {
    super(users);
  }

  @Mutation(() => CreateUserResult)
  async createAdminUser(
    @Args("input") input: CreateAdminUserInput,
    @Context() ctx: GqlContext,
  ): Promise<CreateUserResult> {
    requireAdmin(ctx);
    return this.users.createAdminUser(input);
  }

  @Mutation(() => GenerateInviteResult)
  async generateUserInvite(
    @Args("userId", { type: () => ID }) userId: string,
    @Context() ctx: GqlContext,
  ): Promise<GenerateInviteResult> {
    requireAdmin(ctx);
    return this.users.generateInvite(userId);
  }

  @Mutation(() => Boolean)
  async setUserPassword(
    @Args("userId", { type: () => ID }) userId: string,
    @Args("password") password: string,
    @Context() ctx: GqlContext,
  ): Promise<boolean> {
    requireAdmin(ctx);
    return this.users.setUserPassword(userId, password);
  }

  // Public — no auth required (gateway allows this operation by name)
  @Query(() => InviteInfoDto)
  async userInviteByToken(
    @Args("token") token: string,
  ): Promise<InviteInfoDto> {
    return this.users.getInviteByToken(token);
  }

  // Public — no auth required (gateway allows this operation by name)
  @Mutation(() => Boolean)
  async acceptUserInvite(@Args("input") input: AcceptInviteInput): Promise<boolean> {
    return this.users.acceptInvite(input.token, input.password);
  }
}
