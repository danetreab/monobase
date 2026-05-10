import { Module } from "@nestjs/common";
import { FilesResolver } from "./files.resolver";
import { FilesService } from "./files.service";
import { MinioModule } from "./minio.module";

@Module({
  imports: [MinioModule],
  providers: [FilesResolver, FilesService],
})
export class FilesModule {}
