import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterUploadInput {
  // The fileKey returned by createUploadUrl. Server resolves it back to the
  // pending DB row owned by the caller.
  @Field()
  fileKey!: string;
}
