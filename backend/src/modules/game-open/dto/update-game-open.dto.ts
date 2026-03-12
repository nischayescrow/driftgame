import { PartialType } from '@nestjs/mapped-types';
import { CreateGameOpenLogDto } from './create-game-open.dto';

export class UpdateGameOpenLogDto extends PartialType(
  CreateGameOpenLogDto,
) {}

export class UpdateClientConfigDto {}
