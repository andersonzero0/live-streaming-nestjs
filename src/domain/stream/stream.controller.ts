import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Next,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import path from 'path';
import fs from 'fs';
import * as zlib from 'zlib';

@Controller('stream')
export class StreamController {
  private readonly path: string;
  private readonly debugPlayer: boolean;
  private readonly provider = fsProvider;
  private CONTENT_TYPE = {
    MANIFEST: 'application/vnd.apple.mpegurl',
    SEGMENT: 'video/MP2T',
    HTML: 'text/html',
  };

  constructor() {
    this.path = '/';
    this.debugPlayer = true;
  }

  @Get(':username/*')
  async serveHLS(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
    @Param('username') username: string,
    @Param() params: string[],
  ) {
    if (username === 'player.html' && this.debugPlayer) {
      return this.writeDebugPlayer(res);
    }

    const uri = params[0] || 'output.m3u8';

    const uriRelativeToPath = uri.startsWith(this.path)
      ? uri.slice(this.path.length)
      : uri;

    const relativePath = path.normalize(uriRelativeToPath);
    const filePath = path.join(`public/media/${username}`, relativePath);
    const extension = path.extname(filePath);

    req['filePath'] = filePath;

    const ae = req.headers['accept-encoding'] || '';
    req['acceptsCompression'] = ae.includes('gzip');

    this.provider.exists(req, (err: any, exists: boolean) => {
      if (err) {
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (!exists) {
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
      } else {
        switch (extension) {
          case '.m3u8':
            req.headers['req-username'] = username;
            return this.writeManifest(req, res, next);
          case '.ts':
            return this.writeSegment(req, res);
          default:
            next();
        }
      }
    });
  }

  private writeDebugPlayer(res: Response) {
    res.setHeader('Content-Type', this.CONTENT_TYPE.HTML);
    res.status(HttpStatus.OK).send(`
      <html>
      <head><title>Debug Player</title></head>
        <body>
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <video controls id="video"></video>
        <br>
        <input type="text" />
        <button id="load">Load</button>
        <script>
          if(Hls.isSupported()) {
            var video = document.getElementById('video');
            var hls = new Hls();
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED,function() {
              video.play();
            });
            document.querySelector("#load").addEventListener("click", function () {
              hls.loadSource(document.querySelector("input").value);
            })
         } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.addEventListener('canplay',function() {
              video.play();
            });
            document.querySelector("#load").addEventListener("click", function () {
              video.src = document.querySelector("input").value;
            })
          }
        </script>
        </body>
      </html>`);
  }

  private writeManifest(req: Request, res: Response, next: NextFunction) {
    this.provider.getManifestStream(req, (err: any, stream: fs.ReadStream) => {
      if (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
        return next();
      }

      res.setHeader('Content-Type', this.CONTENT_TYPE.MANIFEST);
      res.status(HttpStatus.OK);

      if (req['acceptsCompression']) {
        res.setHeader('Content-Encoding', 'gzip');
        const gzip = zlib.createGzip();
        stream.pipe(gzip).pipe(res);
      } else {
        stream.pipe(res, { end: true });
      }
    });
  }

  private writeSegment(req: Request, res: Response) {
    this.provider.getSegmentStream(req, (err: any, stream: fs.ReadStream) => {
      if (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
        return;
      }
      res.setHeader('Content-Type', this.CONTENT_TYPE.SEGMENT);
      res.status(HttpStatus.OK);
      stream.pipe(res);
    });
  }
}
const fsProvider = {
  exists(req: Request, cb: (err: any, exists: boolean) => void) {
    fs.exists(req['filePath'], (exists: boolean) => cb(null, exists));
  },
  getSegmentStream(
    req: Request,
    cb: (err: any, stream: fs.ReadStream) => void,
  ) {
    cb(null, fs.createReadStream(req['filePath']));
  },
  getManifestStream(
    req: Request,
    cb: (err: any, stream: fs.ReadStream) => void,
  ) {
    cb(
      null,
      fs.createReadStream(req['filePath'], { highWaterMark: 64 * 1024 }),
    );
  },
};
