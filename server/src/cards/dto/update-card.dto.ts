import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '../schemas/card.schema';

export class UpdateCardDto {
    @ApiProperty({ example: 'Updated Title', required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ example: 'Updated description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '2026-12-31T23:59:59Z', required: false })
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiProperty({ enum: Priority, example: Priority.Medium, required: false })
    @IsEnum(Priority)
    @IsOptional()
    priority?: Priority;

    @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
    @IsMongoId()
    @IsOptional()
    assignee?: string;
}
