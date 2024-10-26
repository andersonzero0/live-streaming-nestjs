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
import { UsersService } from '../users/users.service';
import { serverHLS } from '../../utils/hls';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Stream')
@Controller('stream')
export class StreamController {
  constructor(private readonly usersService: UsersService) {}

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

    serverHLS(req, res, next, username, params[0]);
  }
}
