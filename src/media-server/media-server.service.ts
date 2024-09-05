import { Injectable, OnModuleInit } from '@nestjs/common';
import NodeMediaServer from 'node-media-server';

@Injectable()
export class MediaServerService implements OnModuleInit {
  onModuleInit() {
    const config = {
      rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: 8000,
        allow_origin: '*',
        mediaroot: './media',
      },
    };

    const nms = new NodeMediaServer(config);

    nms.on('postPublish', (id, streamPath) => {
      console.log(`Novo stream iniciado: ${streamPath}`);
    });

    nms.run();
  }
}
