import { Module } from '@nestjs/common';
import { StreamModule } from './modules/stream/stream.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entity/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: '.db/db.sqlite',
      synchronize: true,
      entities: [User],
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    StreamModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
