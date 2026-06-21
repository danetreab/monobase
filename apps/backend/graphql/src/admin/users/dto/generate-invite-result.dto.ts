import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GenerateInviteResult {
  @Field()
  token!: string;

  @Field()
  expiresAt!: Date;
}
