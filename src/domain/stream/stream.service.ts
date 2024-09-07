import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import NodeMediaServer from 'node-media-server';

@Injectable()
export class StreamService implements OnModuleInit {
  private logger = new Logger('StreamService');

  private users: { username: string; streaming: boolean }[] = [
    { username: 'user1', streaming: false },
    { username: 'user2', streaming: false },
  ];

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
      //logType: 0,
    };

    const rtmpServer = new NodeMediaServer(config);

    // auth
    /*rtmpServer.on('preConnect', (id, args) => {
      this.logger.debug(
        `[NodeEvent on preConnect] id=${id} args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('postConnect', (id, args) => {
      this.logger.debug(
        `[NodeEvent on postConnect] id=${id} args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('doneConnect', (id, args) => {
      this.logger.debug(
        `[NodeEvent on doneConnect] id=${id} args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('prePublish', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on prePublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );
    });*/

    // streaming true
    rtmpServer.on('postPublish', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on postPublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );

      const session = rtmpServer.getSession(id);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      session.reject();

      StreamPath = StreamPath.split('/')[2];

      const user = this.users.find((user) => user.username === StreamPath);

      if (!user || user.streaming) {
        this.logger.debug('User not found or already streaming');
        return;
      }

      this.users.forEach((user) => {
        if (user.username === StreamPath) {
          user.streaming = true;
        }
      });

      this.transcode(StreamPath);
    });

    // delete output.m3u8 and output*.ts files / streaming false
    rtmpServer.on('donePublish', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on donePublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );

      this.users.forEach((user) => {
        if (user.username === StreamPath.split('/')[2]) {
          user.streaming = false;
        }
      });
    });

    /*rtmpServer.on('prePlay', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on prePlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('postPlay', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on postPlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('donePlay', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on donePlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('logMessage', (...args) => {
      this.logger.debug(
        `[NodeEvent on logMessage] args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('errorMessage', (...args) => {
      this.logger.error(
        `[NodeEvent on errorMessage] err=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('debugMessage', (...args) => {
      this.logger.debug(
        `[NodeEvent on debugMessage] args=${JSON.stringify(args)}`,
      );
    });

    rtmpServer.on('ffDebugMessage', (...args) => {
      this.logger.debug(
        `[NodeEvent on ffDebugMessage] args=${JSON.stringify(args)}`,
      );
    });*/

    rtmpServer.run();
  }

  transcode(streamPath: string) {
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
