import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Live Video Streaming API')
    .setDescription(
      `### This is a complete API for live video streaming, developed with NestJS. The application uses an RTMP server for video ingestion and the HLS (HTTP Live Streaming) protocol for stream distribution.<br><hr>[GitHub](https://github.com/andersonzero0/live-streaming-nestjs)<br>[What is HLS?](https://developer.apple.com/streaming/)<br>[What is RTMP?](https://en.wikipedia.org/wiki/Real-Time_Messaging_Protocol)`,
    )
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(3000);
}
bootstrap();
