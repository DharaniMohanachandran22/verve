import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '../common/mailer/mailer.service';
import {
  DuplicateEmailException,
  InvalidCredentialsException,
  EmailNotVerifiedException,
  EmailExistsButNotVerifiedException,
  EmailNotFoundException,
  IncorrectPasswordException,
  InvalidOtpException,
  ExpiredOtpException,
  SamePasswordException,
} from '../common/exceptions/custom.exceptions';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) { }

  /**
   * Register a new user with 6-digit OTP
   */
  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const { email, password, name } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new DuplicateEmailException();
      } else {
        // User exists but is not verified. Resend OTP and redirect.
        const otp = this.generateOtp();
        existingUser.otp = otp;
        existingUser.otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
        // Also update name and password in case they changed it
        existingUser.name = name;
        existingUser.password = password; // Pre-save hook will hash it
        await existingUser.save();

        await this.mailerService.sendVerificationOtp(email, otp);
        throw new EmailExistsButNotVerifiedException();
      }
    }

    const otp = this.generateOtp();
    const user = new this.userModel({
      email,
      password,
      name,
      isEmailVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 1 * 60 * 1000), // 1 minute
    });

    const savedUser = await user.save();

    // Send 6-digit OTP
    await this.mailerService.sendVerificationOtp(email, otp);

    return savedUser;
  }

  /**
   * Internal helper to validate OTP
   */
  async validateOtp(email: string, otp: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.otp !== otp) {
      throw new InvalidOtpException();
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      throw new ExpiredOtpException();
    }

    return user;
  }

  /**
   * Verify registration OTP
   */
  async verifyOtp(email: string, otp: string): Promise<{ user: UserDocument; accessToken: string; refreshToken: string }> {
    const user = await this.validateOtp(email, otp);

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    // Generate tokens for automatic login after verification
    const { accessToken, refreshToken } = this.generateTokenPair(user);
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await user.save();

    return { user, accessToken, refreshToken };
  }


  /**
   * Resend registration OTP
   */
  async resendOtp(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const otp = this.generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
    await user.save();

    await this.mailerService.sendVerificationOtp(email, otp);
  }

  /**
   * Login user
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ user: UserDocument; accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new EmailNotFoundException();
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new IncorrectPasswordException();
    }

    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedException();
    }

    const { accessToken, refreshToken } = this.generateTokenPair(user);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    return { user, accessToken, refreshToken };
  }

  /**
   * Forgot Password - Send OTP
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // We don't throw to prevent email enumeration, but we won't send email
      return;
    }

    const otp = this.generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
    await user.save();

    await this.mailerService.sendPasswordResetOtp(email, otp);
  }

  /**
   * Reset Password with OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const user = await this.validateOtp(email, otp);

    const isSamePassword = await this.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new SamePasswordException();
    }

    // Password will be hashed by pre-save hook
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
  }

  /**
   * Verify a refresh token and return its payload (without DB validation)
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      return this.jwtService.verify<{ userId: string; email: string }>(token, {
        secret: process.env.JWT_SECRET || 'default-secret-key',
      });
    } catch {
      return null;
    }
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'default-secret-key',
      });

      const user = await this.usersService.findById(payload.userId);
      if (!user || !user.refreshToken || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokenPair(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateTokenPair(
    user: UserDocument,
  ): { accessToken: string; refreshToken: string } {
    const payload = { userId: user._id.toString(), email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
