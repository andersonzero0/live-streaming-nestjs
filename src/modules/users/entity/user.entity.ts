import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  username: string;

  @ApiProperty({ writeOnly: true })
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  streaming: boolean;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
