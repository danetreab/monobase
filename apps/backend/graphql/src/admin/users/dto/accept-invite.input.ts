import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class AcceptInviteInput {
  @Field()
  token!: string;

  @Field()
  password!: string;
}
