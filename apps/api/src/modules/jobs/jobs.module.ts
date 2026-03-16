import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InactivityWorker } from './inactivity.worker';
import { CronService } from './cron.service';
import { PushModule } from '../push/push.module';
import { StreakModule } from '../streak/streak.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'inactivity-check' }),
    PushModule,
    StreakModule,
  ],
  providers: [InactivityWorker, CronService],
})
export class JobsModule {}
