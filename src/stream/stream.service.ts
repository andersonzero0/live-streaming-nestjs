import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import NodeMediaServer from 'node-media-server';

@Injectable()
export class StreamService implements OnModuleInit {
  private logger = new Logger('StreamService');

  async onModuleInit() {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    this.startRtmpServer();
  }

  startRtmpServer() {
    const config = {
      rtmp: {
        port: 1935,
        chunk_size: 4096,
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
      this.logger.debug(`Stream started: ${streamPath}`);
      this.startStreaming(streamPath);
    });

    nms.run();
  }

  startStreaming(streamPath: string) {
    streamPath = streamPath.split('/')[2];

    const dir = `./public/media/${streamPath}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    ffmpeg(`rtmp://localhost:1935/live/${streamPath}`)
      .addOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-tune zerolatency',
        '-maxrate 3000k',
        '-bufsize 6000k',
        '-pix_fmt yuv420p',
        '-g 50',
        '-c:a aac',
        '-b:a 160k',
        '-ac 2',
        '-ar 44100',
        '-f hls',
        '-hls_time 2',
        '-hls_flags delete_segments',
        '-hls_list_size 3',
      ])
      .output(`./public/media/${streamPath}/output.m3u8`)
      .on('start', () => {
        console.log('FFmpeg started with command');
      })
      .on('end', () => {
        console.log('Conversion finished');
      })
      .run();
  }
}
