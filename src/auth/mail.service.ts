import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        this.initTransporter();
    }

    private async initTransporter() {
        if (
            !process.env.EMAIL_USER ||
            process.env.EMAIL_USER === 'yourgmail@gmail.com'
        ) {
            this.logger.warn('Using Ethereal Email for testing since no real credentials were provided in .env');
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
        } else {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS, // App password
                },
            });
        }
    }

    async sendOtp(email: string, otp: string) {
        if (!this.transporter) {
            await this.initTransporter();
        }

        const info = await this.transporter.sendMail({
            from: `"Earnix Security" <${process.env.EMAIL_USER || 'test@earnix.com'}>`,
            to: email,
            subject: 'Your Earnix OTP Code',
            html: `
        <h2>Your OTP Code</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      `,
        });

        if (info.messageId && nodemailer.getTestMessageUrl(info)) {
            this.logger.log(`preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    }
}