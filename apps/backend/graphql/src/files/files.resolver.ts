import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, type AuthedUser } from "./decorators/current-user.decorator";
import { CreateUploadUrlInput } from "./dto/create-upload-url.input";
import { FileDto } from "./dto/file.dto";
import { RegisterUploadInput } from "./dto/register-upload.input";
import { UploadUrl } from "./dto/upload-url.response";
import { FilesService } from "./files.service";

@Resolver(() => FileDto)
export class FilesResolver {
  constructor(private readonly files: FilesService) {}

  @Mutation(() => UploadUrl, {
    description:
      "Step 1 of the upload flow: returns a pre-signed PUT URL. Client PUTs the binary to MinIO, then calls registerUpload(fileKey).",
  })
  createUploadUrl(
    @Args("input") input: CreateUploadUrlInput,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.files.createUploadUrl(input, user.id);
  }

  @Mutation(() => FileDto, {
    description:
      "Step 2 of the upload flow: confirms a previously presigned upload. The server stats the object in MinIO and flips the DB row to completed.",
  })
  registerUpload(
    @Args("input") input: RegisterUploadInput,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.files.registerUpload(input.fileKey, user.id);
  }

  @Query(() => [FileDto], { name: "files" })
  list(@CurrentUser() user: AuthedUser) {
    return this.files.list(user.id, user.role === "admin");
  }

  @Query(() => FileDto, { name: "file", nullable: true })
  findOne(
    @Args("id", { type: () => ID }) id: string,
    @CurrentUser() user: AuthedUser,
  ) {
    return this.files.findById(id, user.id, user.role === "admin");
  }
}
