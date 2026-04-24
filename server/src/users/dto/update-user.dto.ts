import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiProperty({ example: 'John Doe', required: false })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({ example: 'john@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;
}

export class UpdatePasswordDto {
    @ApiProperty({ example: 'oldPassword123' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
