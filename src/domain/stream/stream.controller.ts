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
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UsersService } from '../users/users.service';
import { serverHLS } from '../../utils/hls';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Stream')
@Controller('stream')
export class StreamController {
  private readonly path: string;

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

    serverHLS(req, res, next, username, filePath);
  }
}
