import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import NodeMediaServer from 'node-media-server';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class StreamService implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  private logger = new Logger('StreamService');

  rtmpServer: NodeMediaServer;

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
        ping: 25,
        ping_timeout: 50,
      },
      logType: 0,
      auth: {
        play: true,
        publish: true,
        secret: `${process.env.RTMP_SECRET_KEY}`,
      },
    };

    this.rtmpServer = new NodeMediaServer(config);

    /*this.rtmpServer.on('preConnect', (id, args) => {
      this.logger.debug(
        `[NodeEvent on preConnect] id=${id} args=${JSON.stringify(args)}`,
      );
    });

    this.rtmpServer.on('postConnect', (id, args) => {
      this.logger.debug(
        `[NodeEvent on postConnect] id=${id} args=${JSON.stringify(args)}`,
      );
    });

    this.rtmpServer.on('doneConnect', (id, args) => {
      this.logger.debug(
        `[NodeEvent on doneConnect] id=${id} args=${JSON.stringify(args)}`,
      );
    });*/

    this.rtmpServer.on('prePublish', async (id, StreamPath, args: any) => {
      this.logger.debug(
        `[NodeEvent on prePublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );

      const session = this.rtmpServer.getSession(id);

      if (!this.isAuthRtmp(StreamPath, args)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        session.reject();
      }

      const username = StreamPath.split('/')[2];

      const dir = `./public/media/${username}`;
      if (fs.existsSync(dir)) {
        this.logger.debug('Deleting directory: ' + dir);
        fs.rmSync(dir, {
          recursive: true,
        });
      }
    });

    // streaming true
    this.rtmpServer.on('postPublish', async (id, StreamPath, args: any) => {
      this.logger.debug(
        `[NodeEvent on postPublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );

      const username = StreamPath.split('/')[2];

      const user = await this.usersService.findOne(username);

      if (!user) {
        return;
      }

      await this.usersService.updateStreaming({
        id: user.id,
        streaming: true,
      });

      if (username && args && args.sign && typeof args.sign === 'string') {
        console.log('Transcoding...');
        this.transcode(username, args.sign);
      }
    });

    this.rtmpServer.on('donePublish', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on donePublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );
    });

    this.rtmpServer.on('prePlay', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on prePlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );

      const session = this.rtmpServer.getSession(id);

      if (!this.isAuthRtmp(StreamPath, args)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        session.reject();
      }
    });

    this.rtmpServer.on('postPlay', (id, StreamPath, args) => {
      this.logger.debug(
        `[NodeEvent on postPlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`,
      );
    });

    /*rtmpServer.on('donePlay', (id, StreamPath, args) => {
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

    this.rtmpServer.run();
  }

  transcode(streamPath: string, sign: string) {
    const dir = `./public/media/${streamPath}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    ffmpeg(`rtmp://localhost:1935/live/${streamPath}?sign=${sign}`)
      .addOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-tune zerolatency',
        '-maxrate 2000k',
        '-bufsize 4000k',
        '-pix_fmt yuv420p',
        '-g 60',
        '-c:a aac',
        '-b:a 128k',
        '-ac 2',
        '-ar 44100',
        '-f hls',
        '-hls_time 2',
        '-hls_flags delete_segments',
        '-hls_list_size 5',
      ])
      .output(`./public/media/${streamPath}/output.m3u8`)
      .on('start', () => {
        console.log('FFmpeg started with command');
      })
      .on('end', async () => {
        console.log('Conversion finished');

        const user = await this.usersService.findOne(streamPath);

        if (!user) {
          return;
        }

        await this.usersService.updateStreaming({
          id: user.id,
          streaming: false,
        });
      })
      .run();
  }

  isAuthRtmp(StreamPath: string, args: any): boolean {
    const path = StreamPath.split('/')[1];
    StreamPath = StreamPath.split('/')[2];

    if (
      path !== 'live' ||
      !StreamPath ||
      !args ||
      !args.sign ||
      typeof args.sign !== 'string'
    ) {
      return false;
    }

    const sign: string = args.sign;

    if (sign.split('-').length !== 2) {
      return false;
    }

    let exp: string | number = sign.split('-')[0];

    if (isNaN(Number(exp))) {
      return false;
    }

    exp = Number(exp);

    const hash = sign.split('-')[1];

    if (exp < Date.now() / 1000) {
      return false;
    }

    const compareHash = crypto
      .createHash('md5')
      .update(`/live/${StreamPath}-${exp}-${process.env.RTMP_SECRET_KEY}`)
      .digest('hex');

    if (hash !== compareHash) {
      return false;
    }

    return true;
  }
}
