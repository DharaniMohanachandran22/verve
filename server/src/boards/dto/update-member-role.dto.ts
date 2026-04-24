import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../schemas/board.schema';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: Role, example: Role.Editor })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsOptional()
  @IsMongoId()
  newOwnerId?: string;
}
