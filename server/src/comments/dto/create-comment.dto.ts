import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({ example: 'This is a comment with @username mention' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string;
}
