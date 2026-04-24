import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveCardDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @IsMongoId()
    @IsNotEmpty()
    listId: string;

    @ApiProperty({ example: 2048, required: false })
    @IsNumber()
    @IsOptional()
    position?: number;
}
