import { Module } from '@nestjs/common';
import { MediaServerService } from './media-server.service';

@Module({
  providers: [MediaServerService],
})
export class MediaServerModule {}
