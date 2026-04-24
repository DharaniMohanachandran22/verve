import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '../schemas/card.schema';

export class CreateCardDto {
    @ApiProperty({ example: 'New Task Title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Detailed description...', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 1024, required: false })
    @IsNumber()
    @IsOptional()
    position?: number;

    @ApiProperty({ enum: Object.values(Priority), required: false })
    @IsEnum(Priority)
    @IsOptional()
    priority?: Priority;
}
