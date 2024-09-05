import { Injectable, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';
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
      //this.transcodeToHLS(streamPath);
    });

    nms.run();
  }

  private transcodeToHLS(streamPath: string) {
    const input = `rtmp://localhost:1935${streamPath}`;
    const output = `./media/${streamPath.split('/').pop()}/index.m3u8`.replace(
      '//',
      '/',
    );

    const command = `ffmpeg -i ${input} -c:v libx264 -c:a aac -strict -2 -f hls -hls_time 10 -hls_list_size 5 -hls_flags delete_segments ${output}`;

    // Executa o comando FFmpeg para gerar o HLS
    exec(command, (error) => {
      if (error) {
        console.error(`Erro ao gerar HLS: ${error.message}`);
        return;
      }
      console.log(`HLS gerado com sucesso: ${output}`);
    });
  }
}
