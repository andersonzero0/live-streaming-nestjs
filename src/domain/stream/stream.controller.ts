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
import { UsersService } from '../users/users.service';
import { fsProvider } from '../../utils/fsProvider';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Stream')
@Controller('stream')
export class StreamController {
  private readonly path: string;
  private readonly provider = fsProvider;
  private CONTENT_TYPE = {
    MANIFEST: 'application/vnd.apple.mpegurl',
    SEGMENT: 'video/MP2T',
    HTML: 'text/html',
  };

  constructor(private readonly usersService: UsersService) {
    this.path = '/';
  }

  @ApiOperation({
    summary: 'Stream video (HLS protocol)',
    description: `## This endpoint should be called by a video player that supports the HLS protocol to stream videos. The player must provide the username as part of the URL path.`,
  })
  @Get(':username/*')
  async serveHLS(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
    @Param('username') username: string,
    @Param() params: string[],
  ) {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    if (!user.streaming) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
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
