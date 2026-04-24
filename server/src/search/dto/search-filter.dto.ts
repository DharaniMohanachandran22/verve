import { IsArray, IsEnum, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '../../cards/schemas/card.schema';

export class SearchCardsDto {
    @ApiProperty({ example: 'feature request' })
    @IsString()
    @MinLength(1)
    query: string;
}

export class FilterCardsDto {
    @ApiProperty({ example: ['60d5ecb8b3934300158d3135'], required: false })
    @IsArray()
    @IsOptional()
    assigneeIds?: string[];

    @ApiProperty({ example: ['60d5ecb8b3934300158d3136'], required: false })
    @IsArray()
    @IsOptional()
    labelIds?: string[];

    @ApiProperty({ enum: Priority, isArray: true, required: false })
    @IsArray()
    @IsEnum(Priority, { each: true })
    @IsOptional()
    priorities?: Priority[];

    @ApiProperty({ example: '2024-01-01', required: false })
    @IsISO8601()
    @IsOptional()
    dueDateStart?: string;

    @ApiProperty({ example: '2024-12-31', required: false })
    @IsISO8601()
    @IsOptional()
    dueDateEnd?: string;
}
