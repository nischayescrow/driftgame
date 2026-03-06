import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailLoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password: string;
}
