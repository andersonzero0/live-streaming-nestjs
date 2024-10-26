import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { GetGenerateTokenRtmpDto, UserDto } from './dto/user.dto';
import { User } from './entity/user.entity';
import { DeleteResult } from 'typeorm';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Create user',
  })
  @ApiResponse({ status: 201, type: User })
  @ApiResponse({ status: 403, description: 'User already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post()
  async create(@Body() data: UserDto): Promise<User> {
    try {
      return this.usersService.create(data);
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Get all users',
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async findAll(): Promise<User[]> {
    try {
      return this.usersService.findAll();
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Get user by username',
  })
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

  @ApiOperation({
    summary: 'Generate RTMP token',
  })
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

  @ApiOperation({
    summary: 'Update user',
  })
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UserDto): Promise<User> {
    try {
      return this.usersService.update(id, data);
    } catch (error) {
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Delete user',
  })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<DeleteResult> {
    try {
      return this.usersService.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
