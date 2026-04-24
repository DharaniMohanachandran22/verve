import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService implements OnModuleInit {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailerService.name);

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASS');
        const smtpHost = this.configService.get<string>('SMTP_HOST');

        if (smtpUser && smtpPass && smtpHost) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10),
                secure: String(this.configService.get('SMTP_SECURE')) === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            // Verify connection configuration
            try {
                await this.transporter.verify();
                this.logger.log('SMTP configuration verified successfully');
            } catch (error) {
                this.logger.error('SMTP configuration failed. Please check your credentials.', error.stack);
            }
        } else {
            this.logger.warn('---------------------------------------------------------');
            this.logger.warn('--- MailerService: Running in DEVELOPMENT MODE ---');
            this.logger.warn('--- No SMTP credentials found in server/.env ---');
            this.logger.warn('--- OTP will be logged only to this terminal ---');
            this.logger.warn('---------------------------------------------------------');
        }
    }

    async sendMail(to: string, subject: string, text: string, html?: string) {
        // If no SMTP configured, just log to console for development
        if (!this.configService.get('SMTP_USER') || !this.configService.get('SMTP_PASS')) {
            this.logger.warn('--- EMAIL NOT SENT (SMTP NOT CONFIGURED) ---');
            this.logger.warn(`Recipient: ${to}`);
            this.logger.warn(`OTP Code: ${text.match(/\d{6}/)?.[0] || 'Unknown'}`);
            this.logger.warn('To fix this, update SMTP_USER and SMTP_PASS in server/.env');
            this.logger.warn('---------------------------------------------');
            return;
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get('EMAIL_FROM') || '"Verve" <no-reply@verve.com>',
                to,
                subject,
                text,
                html: html || text,
            });
            this.logger.log(`Email sent successfully to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error.stack);
            // Don't throw in development if it fails
            if (process.env.NODE_ENV === 'production') throw error;
        }
    }

    async sendVerificationOtp(to: string, otp: string) {
        const subject = 'Verve | Verify Your Identity';
        const text = `Your Verve verification code is: ${otp}. This code will expire in 10 minutes.`;
        const html = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #059669;">Welcome to Verve</h2>
        <p>Please use the following code to verify your identity:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #042f2e; margin: 20px 0;">${otp}</div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
        await this.sendMail(to, subject, text, html);
    }

    async sendPasswordResetOtp(to: string, otp: string) {
        const subject = 'Verve | Reset Your Secure Key';
        const text = `Your Verve password reset code is: ${otp}. This code will expire in 10 minutes.`;
        const html = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #059669;">Password Reset Request</h2>
        <p>We received a request to reset your master key. Use this code to continue:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #042f2e; margin: 20px 0;">${otp}</div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please secure your account immediately.</p>
      </div>
    `;
        await this.sendMail(to, subject, text, html);
    }

    async sendBoardInvitation(to: string, inviterName: string, boardName: string, acceptUrl: string) {
        const subject = `Verve | You've been invited to join "${boardName}"`;
        const text = `${inviterName} has invited you to collaborate on "${boardName}". Accept the invitation: ${acceptUrl}`;
        const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 480px; margin: auto;">
        <h2 style="color: #059669;">Board Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${boardName}</strong>.</p>
        <a href="${acceptUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#059669;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a>
        <p style="color:#64748b;font-size:13px;margin-top:16px;">This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
      </div>
    `;
        await this.sendMail(to, subject, text, html);
    }
}