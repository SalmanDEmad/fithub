import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { GymModule } from './modules/gym/gym.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MemberModule } from './modules/member/member.module';
import { PushModule } from './modules/push/push.module';
import { StreakModule } from './modules/streak/streak.module';

@Module({
  imports: [
    // Global config (reads .env)
    ConfigModule.forRoot({ isGlobal: true }),

    // BullMQ root Redis connection (review point #6)
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Core modules
    PrismaModule,
    HealthModule,

    // Feature modules
    StreakModule,
    GymModule,
    CheckinModule,
    MemberModule,
    PushModule,
    JobsModule,
  ],
})
export class AppModule {}
