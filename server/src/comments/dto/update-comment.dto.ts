import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
    @ApiProperty({ example: 'Updated comment content' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string;
}
