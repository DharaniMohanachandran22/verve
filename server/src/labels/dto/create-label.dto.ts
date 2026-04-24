import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLabelDto {
    @ApiProperty({ example: 'Bug' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '#ff0000' })
    @IsHexColor()
    @IsNotEmpty()
    color: string;
}
