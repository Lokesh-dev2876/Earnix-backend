import {
    Controller,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('withdrawal')
export class WithdrawalController {
    constructor(private readonly withdrawalService: WithdrawalService) { }

    // 🔐 User requests withdrawal
    @UseGuards(JwtAuthGuard)
    @Post('request')
    request(@Body() body) {
        return this.withdrawalService.requestWithdrawal(
            body.userId,
            body.amount,
            body.method,
        );
    }

    // 🛡 Admin approves
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('approve/:id')
    approve(@Param('id') id: string) {
        return this.withdrawalService.approveWithdrawal(Number(id));
    }

    // 🛡 Admin rejects
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('reject/:id')
    reject(@Param('id') id: string) {
        return this.withdrawalService.rejectWithdrawal(Number(id));
    }
}