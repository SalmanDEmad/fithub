import { Module } from '@nestjs/common';
import { CheckinController } from './checkin.controller';
import { StreakModule } from '../streak/streak.module';

@Module({
  imports: [StreakModule],
  controllers: [CheckinController],
})
export class CheckinModule {}
