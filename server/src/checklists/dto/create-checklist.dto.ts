import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChecklistDto {
    @ApiProperty({ example: 'Task list' })
    @IsString()
    @IsNotEmpty()
    title: string;
}
