import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CreateUploadUrlInput {
  @Field()
  originalName!: string;

  @Field()
  contentType!: string;

  // Optional client-declared size — used to seed the DB row. The authoritative
  // size is read from MinIO (statObject) at registration time.
  @Field(() => Int, { nullable: true })
  sizeBytes?: number;
}
