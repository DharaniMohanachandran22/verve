import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChecklistItemDto {
    @ApiProperty({ example: 'Updated task text', required: false })
    @IsString()
    @IsOptional()
    text?: string;

    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @ApiProperty({ example: '60d...123', required: false })
    @IsString()
    @IsOptional()
    assignee?: string | null;
}
