import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class InviteInfoDto {
  @Field()
  userId!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  expiresAt!: Date;
}
