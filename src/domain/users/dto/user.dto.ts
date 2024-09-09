import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

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
  @IsString()
  @IsNotEmpty()
  password: string;
}
