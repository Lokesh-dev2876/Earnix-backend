import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { VerifyOtpDto } from './verify-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SetPinDto } from './set-pin.dto';
import { LoginWithPinDto } from './login-with-pin.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('send-otp')
    sendOtp(@Body() loginDto: LoginDto) {
        return this.authService.sendOtp(loginDto);
    }

    @Post('forgot-pin')
    forgotPin(@Body() loginDto: LoginDto) {
        return this.authService.forgotPin(loginDto);
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('set-pin')
    setPin(@Request() req, @Body() dto: SetPinDto) {
        return this.authService.setPin(req.user.sub || req.user.userId || req.user.id, dto.pin);
    }

    @Post('login-with-pin')
    loginWithPin(@Body() dto: LoginWithPinDto) {
        return this.authService.loginWithPin(dto);
    }
}