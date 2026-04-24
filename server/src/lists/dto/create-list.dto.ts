import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListDto {
    @ApiProperty({ example: 'To Do' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 1024, required: false })
    @IsNumber()
    @IsOptional()
    position?: number;
}
