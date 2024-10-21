import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateStreaming {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  streaming: boolean;
}

export class GetGenerateTokenRtmpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
