import { IsHexColor, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLabelDto {
    @ApiProperty({ example: 'Bug', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: '#ff0000', required: false })
    @IsHexColor()
    @IsOptional()
    color?: string;
}
