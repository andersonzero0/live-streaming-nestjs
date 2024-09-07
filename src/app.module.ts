import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamModule } from './domain/stream/stream.module';

@Module({
  imports: [StreamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
