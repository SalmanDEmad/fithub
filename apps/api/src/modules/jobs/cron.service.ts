import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CronService implements OnModuleInit {
  constructor(
    @InjectQueue('inactivity-check') private inactivityQueue: Queue,
  ) {}

  async onModuleInit() {
    // Run inactivity checks every 6 hours
    await this.inactivityQueue.upsertJobScheduler(
      'inactivity-check-schedule',
      { pattern: '0 */6 * * *' },
      { name: 'check-inactivity', data: {} },
    );
    console.log('[CronService] Inactivity check scheduled every 6 hours');
  }
}
