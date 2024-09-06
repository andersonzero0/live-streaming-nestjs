import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Next,
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
  private readonly dir: string;
  private readonly debugPlayer: boolean;
  private readonly provider = fsProvider;
  private CONTENT_TYPE = {
    MANIFEST: 'application/vnd.apple.mpegurl',
    SEGMENT: 'video/MP2T',
    HTML: 'text/html',
  };

  constructor() {
    this.path = '/'; // Base path do servidor
    this.dir = 'public/media/test'; // Diretório onde estão os arquivos HLS
    this.debugPlayer = true; // Ativar o debug player
  }

  @Get('*')
  async serveHLS(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    const uri = req.url.split('/').slice(2).join('/');

    const uriRelativeToPath = uri.startsWith(this.path)
      ? uri.slice(this.path.length)
      : uri;

    const relativePath = path.normalize(uriRelativeToPath);
    const filePath = path.join(this.dir, relativePath);
    const extension = path.extname(filePath);

    req['filePath'] = filePath;

    console.log('filePath', filePath);

    // Verifica se Gzip é aceito
    const ae = req.headers['accept-encoding'] || '';
    req['acceptsCompression'] = ae.includes('gzip');

    // Se for o player de debug, retorna o HTML do player
    if (uri === '/player.html' && this.debugPlayer) {
      return this.writeDebugPlayer(res);
    }

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
    res
      .status(HttpStatus.OK)
      .send('<h1>HLS Debug Player</h1><p>Player em desenvolvimento...</p>');
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
