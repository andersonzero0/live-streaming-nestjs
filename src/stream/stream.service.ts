import { Injectable, OnModuleInit } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class StreamService implements OnModuleInit {
  onModuleInit() {
    console.log('Stream service initialized');
    ffmpeg('rtmp://localhost:1935/live/test', { timeout: 4800000 })
      .addOptions([
        '-c:v libx264',
        '-c:a aac',
        '-ac 1',
        '-strict -2',
        '-crf 18',
        '-profile:v baseline',
        '-maxrate 400k',
        '-bufsize 1835k',
        '-pix_fmt yuv420p',
        '-hls_time 10',
        '-hls_list_size 6',
        '-hls_wrap 10',
        '-start_number 1',
      ])
      .output('./public/videos/output.m3u8')
      .on('start', function (commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('progress', function (progress) {
        console.log('Processing: ' + progress.percent + '% done');
      })
      .on('end', function () {
        console.log('file has been converted successfully');
      })
      .on('error', function (err, stdout, stderr) {
        console.log('An error occurred: ' + err.message);
        console.log('ffmpeg stdout: ' + stdout);
        console.log('ffmpeg stderr: ' + stderr);
      });
  }
}
