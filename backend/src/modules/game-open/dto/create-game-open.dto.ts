import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGameOpenLogDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  lastOpenedAt: Date;
}
