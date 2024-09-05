import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaServerModule } from './media-server/media-server.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [MediaServerModule, StreamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
