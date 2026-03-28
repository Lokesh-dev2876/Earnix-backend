import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    WithdrawalModule,
  ],
})
export class AppModule { }