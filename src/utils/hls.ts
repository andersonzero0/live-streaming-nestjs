import { HttpException, HttpStatus } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fsProvider } from './fsProvider';

const provider = fsProvider;
const CONTENT_TYPE = {
  MANIFEST: 'application/vnd.apple.mpegurl',
  SEGMENT: 'video/MP2T',
  HTML: 'text/html',
};

export function serverHLS(
  req: Request,
  res: Response,
  next: NextFunction,
  username: string,
  filePath: string,
) {
  req['filePath'] = filePath;
  const extension = path.extname(filePath);

  const ae = req.headers['accept-encoding'] || '';
  req['acceptsCompression'] = ae.includes('gzip');

  provider.exists(req, (err: any, exists: boolean) => {
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
          return writeManifest(req, res, next);
        case '.ts':
          return writeSegment(req, res);
        default:
          next();
      }
    }
  });
}

export function writeManifest(req: Request, res: Response, next: NextFunction) {
  provider.getManifestStream(req, (err: any, stream: fs.ReadStream) => {
    if (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return next();
    }

    res.setHeader('Content-Type', CONTENT_TYPE.MANIFEST);
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

export function writeSegment(req: Request, res: Response) {
  provider.getSegmentStream(req, (err: any, stream: fs.ReadStream) => {
    if (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return;
    }
    res.setHeader('Content-Type', CONTENT_TYPE.SEGMENT);
    res.status(HttpStatus.OK);
    stream.pipe(res);
  });
}
