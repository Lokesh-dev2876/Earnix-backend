import {
    Injectable,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WithdrawalService {
    constructor(private prisma: PrismaService) { }

    // 🔹 User requests withdrawal
    async requestWithdrawal(userId: number, amount: number, method: 'UPI' | 'BANK') {
        if (amount < 50) {
            throw new BadRequestException('Minimum withdrawal is ₹50');
        }

        // Check wallet
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet || wallet.balance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        // Daily limit (max 3 per day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = await this.prisma.withdrawal.count({
            where: {
                userId,
                createdAt: {
                    gte: today,
                },
            },
        });

        if (todayCount >= 3) {
            throw new ForbiddenException('Daily withdrawal limit reached');
        }

        // Create withdrawal (PENDING)
        return this.prisma.withdrawal.create({
            data: {
                userId,
                amount,
                method,
                status: 'PENDING',
            },
        });
    }

    // 🔹 Admin approves withdrawal
    async approveWithdrawal(withdrawalId: number) {
        const withdrawal = await this.prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });

        if (!withdrawal) {
            throw new BadRequestException('Withdrawal not found');
        }

        if (withdrawal.status !== 'PENDING') {
            throw new BadRequestException('Already processed');
        }

        // Deduct wallet safely (ACID safe)
        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId: withdrawal.userId },
                data: {
                    balance: {
                        decrement: withdrawal.amount,
                    },
                },
            }),
            this.prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: { status: 'APPROVED' },
            }),
            this.prisma.transaction.create({
                data: {
                    userId: withdrawal.userId,
                    amount: withdrawal.amount,
                    type: 'WITHDRAWAL',
                    status: 'APPROVED',
                    description: 'Withdrawal Approved',
                },
            }),
        ]);

        return { message: 'Withdrawal approved successfully' };
    }

    // 🔹 Admin rejects withdrawal
    async rejectWithdrawal(withdrawalId: number) {
        return this.prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'REJECTED' },
        });
    }
}