import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  username: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  streaming: boolean;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

export class UserWithoutPassword extends User {
  @Exclude()
  password: string;

  constructor(partial: Partial<User>) {
    super(partial);
    Object.assign(this, partial);
  }
}
