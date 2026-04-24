import {
    Controller,
    Get,
    Param,
    NotFoundException,
    Patch,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UpdateProfileDto, UpdatePasswordDto } from './dto/update-user.dto';
import { AuthGuard } from '../boards/guards/auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @ApiOperation({ summary: 'Get user details by ID' })
    @ApiResponse({ status: 200, description: 'User data' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Get(':userId')
    async getUser(@Param('userId', ParseObjectIdPipe) userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Convert to object and omit password
        const userResponse = user.toObject();
        delete userResponse.password;

        return userResponse;
    }

    @ApiOperation({ summary: 'Update your profile (name/email)' })
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({ status: 200, description: 'User updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Patch('profile')
    async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
        const userId = (req as any).user.userId;
        const user = await this.usersService.updateProfile(userId, dto);

        const userResponse = user.toObject();
        delete userResponse.password;
        return userResponse;
    }

    @ApiOperation({ summary: 'Update your password' })
    @ApiBody({ type: UpdatePasswordDto })
    @ApiResponse({ status: 200, description: 'Password updated' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Patch('password')
    async updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
        const userId = (req as any).user.userId;
        await this.usersService.updatePassword(userId, dto);
        return { message: 'Password updated successfully' };
    }
}
