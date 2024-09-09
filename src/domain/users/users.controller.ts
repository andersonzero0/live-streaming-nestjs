import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  GetGenerateTokenRtmpDto,
  UpdateStreaming,
  UserDto,
} from './dto/user.dto';
import { User, UserWithoutPassword } from './entity/user.entity';
import { DeleteResult } from 'typeorm';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() data: UserDto): Promise<User> {
    try {
      return this.usersService.create(data);
    } catch (error) {
      throw error;
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async findAll(): Promise<UserWithoutPassword[]> {
    try {
      return this.usersService.findAll();
    } catch (error) {
      throw error;
    }
  }

  @Get(':username')
  async findOne(
    @Param('username') username: string,
  ): Promise<User | undefined> {
    try {
      return this.usersService.findOne(username);
    } catch (error) {
      throw error;
    }
  }

  @Get('generate-rtmp-token/:id')
  async generateToken(
    @Param('id') id: string,
    @Query() data: GetGenerateTokenRtmpDto,
  ): Promise<{ token: string }> {
    try {
      return this.usersService.generateRtmpToken(id, data.password);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UserDto): Promise<User> {
    try {
      return this.usersService.update(id, data);
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/streaming/:streaming')
  async streaming(@Param() params: UpdateStreaming): Promise<User> {
    try {
      return this.usersService.updateStreaming(params);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<DeleteResult> {
    try {
      return this.usersService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
