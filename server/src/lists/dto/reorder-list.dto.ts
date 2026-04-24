import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderListDto {
    @ApiProperty({ example: 2048 })
    @IsNumber()
    @IsNotEmpty()
    position: number;
}
