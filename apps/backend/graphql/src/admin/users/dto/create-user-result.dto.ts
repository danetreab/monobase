import { Field, ObjectType } from "@nestjs/graphql";
import { UserDto } from "./user.dto";

@ObjectType()
export class CreateUserResult {
  @Field(() => UserDto)
  user!: UserDto;

  @Field({ nullable: true })
  inviteToken?: string;
}
