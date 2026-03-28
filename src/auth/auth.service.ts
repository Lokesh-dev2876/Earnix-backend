import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './login.dto';
import { VerifyOtpDto } from './verify-otp.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
        private mailService: MailService, // ✅ fixed camelCase
    ) { }

    // 🔥 STEP 1: Send OTP
    async sendOtp(loginDto: LoginDto) {
        try {
            const { email, deviceId } = loginDto;

            let user = await this.prisma.user.findUnique({
                where: { email },
            });

            // Auto create user if not exists
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        email,
                        deviceId,
                    },
                });
            }

            if (user.isBanned) {
                throw new UnauthorizedException('Account banned');
            }

            if (user.pin) {
                return { hasPin: true, message: 'User has PIN' };
            }

            // Generate 4 digit OTP
            const otp = Math.floor(1000 + Math.random() * 9000).toString();

            const hashedOtp = await bcrypt.hash(otp, 10);

            // ✅ Save OTP in DB (FIXED)
            await this.prisma.user.update({
                where: { email },
                data: {
                    otpHash: hashedOtp,
                    otpExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                },
            });

            // ✅ Send Email
            await this.mailService.sendOtp(email, otp);

            console.log('🔥 OTP:', otp); // For testing only

            return { message: 'OTP sent successfully', hasPin: false };
        } catch (error) {
            console.error("OTP ERROR:", error.message);
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(error.message || 'Error sending OTP');
        }
    }

    // 🔥 STEP 1b: Forgot PIN (Force OTP)
    async forgotPin(loginDto: LoginDto) {
        const { email } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) throw new UnauthorizedException('User not found');
        if (user.isBanned) throw new UnauthorizedException('Account banned');

        // Generate 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await this.prisma.user.update({
            where: { email },
            data: {
                otpHash: hashedOtp,
                otpExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            },
        });

        await this.mailService.sendOtp(email, otp);
        console.log('🔥 FORGOT PIN OTP:', otp); // For testing only

        return { message: 'Reset OTP sent successfully' };
    }

    // 🔥 STEP 2: Verify OTP
    async verifyOtp(dto: VerifyOtpDto) {
        const { email, otp, deviceId } = dto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.isBanned) {
            throw new UnauthorizedException('Account banned');
        }

        if (!user.otpHash || !user.otpExpiry) {
            throw new BadRequestException('OTP not requested');
        }

        if (user.otpExpiry < new Date()) {
            throw new BadRequestException('OTP expired');
        }

        const isMatch = await bcrypt.compare(otp, user.otpHash);

        if (!isMatch) {
            throw new UnauthorizedException('Invalid OTP');
        }

        // Bind device & clear OTP
        await this.prisma.user.update({
            where: { email },
            data: {
                deviceId,
                otpHash: null,
                otpExpiry: null,
            },
        });

        // 🔐 Create JWT
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    // 🔥 STEP 3: Set PIN
    async setPin(userId: number, pin: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');
        
        await this.prisma.user.update({
            where: { id: userId },
            data: { pin },
        });

        return { message: 'PIN set successfully' };
    }

    // 🔥 STEP 4: Login with PIN
    async loginWithPin(dto: any) {
        const { email, pin, deviceId } = dto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        
        if (!user) throw new UnauthorizedException('User not found');
        if (user.isBanned) throw new UnauthorizedException('Account banned');
        if (!user.pin) throw new BadRequestException('PIN not set');
        
        if (user.pin !== pin) throw new UnauthorizedException('Invalid PIN');

        // BIND DEVICE
        await this.prisma.user.update({
            where: { email },
            data: { deviceId },
        });

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}