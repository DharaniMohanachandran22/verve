import { Controller, Post, Body, Get, Res, Req, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

// sameSite must be 'lax' in dev (cross-port localhost) and 'strict' in production
const COOKIE_SAME_SITE: 'strict' | 'lax' = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';

function cookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: COOKIE_SAME_SITE,
        path: '/',
        maxAge,
    };
}

function sanitizeUser(user: any) {
    const userResponse = user.toObject ? user.toObject() : { ...user };
    delete userResponse.password;
    delete userResponse.emailVerificationToken;
    delete userResponse.emailVerificationTokenExpiry;
    delete userResponse.refreshToken;
    delete userResponse.refreshTokenExpiry;
    userResponse.id = userResponse._id?.toString();
    return userResponse;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) { }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 200, description: 'User registered successfully. Verification email sent.' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(registerDto);
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.emailVerificationToken;
        delete userResponse.emailVerificationTokenExpiry;
        delete userResponse.refreshToken;
        delete userResponse.refreshTokenExpiry;
        return {
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: userResponse,
        };
    }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { user, accessToken, refreshToken } = await this.authService.login(loginDto);

        res.cookie('access_token', accessToken, cookieOptions(15 * 60 * 1000));
        res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

        return { success: true, message: 'Login successful', data: { user: sanitizeUser(user), accessToken } };
    }

    @Public()
    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body() body: { refreshToken?: string }, @Res({ passthrough: true }) res: Response) {
        const refreshToken = body.refreshToken || (res.req as any).cookies?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token required');
        }

        const tokens = await this.authService.refreshTokens(refreshToken);

        res.cookie('access_token', tokens.accessToken, cookieOptions(15 * 60 * 1000));
        res.cookie('refresh_token', tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

        return { success: true, message: 'Tokens refreshed successfully', data: { accessToken: tokens.accessToken } };
    }

    @Public()
    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify registration OTP' })
    @ApiBody({ type: VerifyOtpDto })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async verifyOtp(@Body() body: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
        const { user, accessToken, refreshToken } = await this.authService.verifyOtp(body.email, body.otp);

        res.cookie('access_token', accessToken, cookieOptions(15 * 60 * 1000));
        res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

        return { success: true, message: 'Email verified successfully', data: { user: sanitizeUser(user), accessToken } };
    }

    @Public()
    @Post('resend-otp')
    @ApiOperation({ summary: 'Resend registration OTP' })
    @ApiBody({ type: ResendOtpDto })
    @ApiResponse({ status: 200, description: 'OTP resent successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async resendOtp(@Body() body: ResendOtpDto) {
        await this.authService.resendOtp(body.email);
        return { success: true, message: 'Verification code resent successfully', data: null };
    }

    @Public()
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset OTP' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({ status: 200, description: 'If account exists, OTP sent' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async forgotPassword(@Body() body: ForgotPasswordDto) {
        await this.authService.forgotPassword(body.email);
        return { success: true, message: 'If your account exists, a security code has been sent.', data: null };
    }

    @Public()
    @Post('validate-otp')
    @ApiOperation({ summary: 'Validate OTP without side effects' })
    @ApiResponse({ status: 200, description: 'OTP is valid' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async validateOtp(@Body() body: { email: string; otp: string }) {
        await this.authService.validateOtp(body.email, body.otp);
        return { success: true, message: 'OTP validated successfully', data: null };
    }

    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with OTP' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async resetPassword(@Body() body: ResetPasswordDto) {
        await this.authService.resetPassword(body.email, body.otp, body.password);
        return { success: true, message: 'Password reset successful. You can now sign in with your new key.', data: null };
    }

    @Public()
    @Post('logout')
    @ApiOperation({ summary: 'Logout current user' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        console.log('Logout requested. Cookies received:', req.cookies);
        const refreshToken = req.cookies?.refresh_token || req.cookies?.['user-refresh-token'];

        if (refreshToken) {
            try {
                const payload = await this.authService.verifyRefreshToken(refreshToken);
                if (payload?.userId) {
                    console.log(`Invalidating refresh token for user ${payload.userId}`);
                    const fullUser = await this.usersService.findById(payload.userId);
                    if (fullUser) {
                        fullUser.refreshToken = undefined;
                        fullUser.refreshTokenExpiry = undefined;
                        await fullUser.save();
                    }
                }
            } catch (err) {
                console.error('Error during token invalidation:', err);
                // invalid/expired — still clear cookies
            }
        }

        const clearOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: COOKIE_SAME_SITE,
            path: '/',
            expires: new Date(0),
        };

        // Clear all possible variations of token cookies with explicit expiration
        res.cookie('access_token', '', clearOpts);
        res.cookie('refresh_token', '', clearOpts);
        res.cookie('user-access-token', '', clearOpts);
        res.cookie('user-refresh-token', '', clearOpts);

        console.log('Logged out. Clear-Cookie headers should be sent.');
        return { success: true, message: 'Logged out successfully', data: null };
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    @ApiResponse({ status: 200, description: 'User profile returned' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser() user: any) {
        const fullUser = await this.usersService.findById(user.userId);
        const userResponse = fullUser?.toObject();
        if (userResponse) {
            delete userResponse.password;
            delete userResponse.emailVerificationToken;
            delete userResponse.emailVerificationTokenExpiry;
            delete userResponse.refreshToken;
            delete userResponse.refreshTokenExpiry;
            userResponse.id = userResponse._id?.toString();
        }
        return { success: true, message: 'User profile retrieved', data: userResponse };
    }
}
