import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateAdminUserInput {
  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field({ defaultValue: "user" })
  role!: string;

  @Field({ nullable: true })
  password?: string;
}
