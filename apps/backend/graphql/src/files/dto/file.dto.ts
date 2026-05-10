import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import {
  FilterableField,
  IDField,
  SortableField,
} from "../../lib/nestjs-query-drizzle";

export enum FileStatus {
  pending = "pending",
  completed = "completed",
  failed = "failed",
}

registerEnumType(FileStatus, { name: "FileStatus" });

@ObjectType("File")
export class FileDto {
  @IDField()
  id!: string;

  @FilterableField()
  @SortableField()
  key!: string;

  @Field()
  bucket!: string;

  @FilterableField()
  @SortableField()
  originalName!: string;

  @FilterableField()
  contentType!: string;

  @Field(() => Int, { nullable: true })
  sizeBytes?: number | null;

  @Field({ nullable: true })
  etag?: string | null;

  @FilterableField(() => FileStatus)
  @SortableField(() => FileStatus)
  status!: FileStatus;

  @FilterableField()
  uploadedBy!: string;

  @FilterableField(() => Date)
  @SortableField(() => Date)
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  completedAt?: Date | null;

  @FilterableField(() => Date)
  @SortableField(() => Date)
  updatedAt!: Date;
}
