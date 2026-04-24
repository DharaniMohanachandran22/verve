import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'My Project Board' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'My project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
