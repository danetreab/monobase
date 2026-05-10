import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UploadUrl {
  // Pre-signed PUT URL — the client uploads the binary directly to MinIO
  // with `PUT` and the same Content-Type that was used to presign.
  @Field()
  uploadUrl!: string;

  // Echoed back to registerUpload to finalize the metadata row.
  @Field()
  fileKey!: string;

  @Field()
  bucket!: string;

  @Field(() => Int)
  expiresInSeconds!: number;
}
