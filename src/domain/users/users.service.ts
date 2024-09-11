import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UpdateStreaming, UserDto } from './dto/user.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private user: Repository<User>) {}

  async create(data: UserDto): Promise<User> {
    try {
      const { username, password } = data;

      const salt = await bcrypt.genSalt();

      const hash = await bcrypt.hash(password, salt);

      const user = await this.user.save({ username, password: hash });

      return new User(user);
    } catch (error) {
      throw error;
    }
  }

  async findOne(username: string): Promise<User | undefined> {
    try {
      return this.user.findOne({ where: { username } });
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    try {
      return this.user.findOne({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return this.user.find();
    } catch (error) {
      throw error;
    }
  }

  async generateRtmpToken(
    id: string,
    password: string,
  ): Promise<{ token: string }> {
    try {
      const user = await this.findById(id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        throw new ForbiddenException('Invalid password');
      }

      const days = 1;
      const expire_time = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * days;
      const secret = process.env.RTMP_SECRET_KEY;

      const hash = crypto
        .createHash('md5')
        .update(`/live/${user.username}-${expire_time}-${secret}`)
        .digest('hex');

      return { token: `${expire_time}-${hash}` };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, data: UserDto): Promise<User> {
    try {
      const { username, password } = data;

      const salt = await bcrypt.genSalt();

      const hash = await bcrypt.hash(password, salt);

      await this.user.update(id, { username, password: hash });

      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async updateStreaming(data: UpdateStreaming): Promise<User> {
    try {
      const { id, streaming } = data;
      await this.user.update(id, { streaming });

      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<DeleteResult> {
    try {
      return this.user.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
