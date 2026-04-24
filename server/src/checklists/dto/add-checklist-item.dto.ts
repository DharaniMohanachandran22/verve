import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddChecklistItemDto {
    @ApiProperty({ example: 'Complete the header' })
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiProperty({ example: 1024, required: false })
    @IsNumber()
    @IsOptional()
    position?: number;

    @ApiProperty({ example: '60d...123', required: false })
    @IsString()
    @IsOptional()
    assignee?: string;
}
