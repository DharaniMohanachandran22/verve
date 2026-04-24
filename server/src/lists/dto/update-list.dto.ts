import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateListDto {
    @ApiProperty({ example: 'Updated Name', required: false })
    @IsString()
    @IsOptional()
    name?: string;
}
