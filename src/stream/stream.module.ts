import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';

@Module({
  providers: [StreamService]
})
export class StreamModule {}
