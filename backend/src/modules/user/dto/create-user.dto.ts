import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserStatus } from '../schemas/user.schema';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  email_verified?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
