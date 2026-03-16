import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { getInactivityMessage, RiskLevel } from '@fithub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { StreakService } from '../streak/streak.service';

@Processor('inactivity-check')
export class InactivityWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly streakService: StreakService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const now = new Date();

    const streaks = await this.prisma.memberStreak.findMany({
      include: {
        member: {
          include: {
            gym: true,
          },
        },
      },
    });

    for (const streak of streaks) {
      const effectiveGoal = this.streakService.getEffectiveGoal(
        streak.member.personal_weekly_goal,
        streak.member.gym.weekly_visit_goal,
      );

      const freshStreak = await this.streakService.rolloverStreak(
        streak,
        streak.member.gym.timezone,
        effectiveGoal,
        now,
      );

      if (!freshStreak.last_visit_at) {
        continue;
      }

      const daysSince = Math.floor(
        (now.getTime() - freshStreak.last_visit_at.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      let newRisk: RiskLevel = 'active';
      if (daysSince >= 21) newRisk = 'lapsed';
      else if (daysSince >= 14) newRisk = 'high_risk';
      else if (daysSince >= 7) newRisk = 'at_risk';

      if (newRisk !== freshStreak.risk_level) {
        await this.prisma.memberStreak.update({
          where: { member_id: freshStreak.member_id },
          data: { risk_level: newRisk, updated_at: now },
        });

        if (shouldNotify(newRisk, freshStreak.risk_level)) {
          const totalVisits = await this.prisma.attendanceEvent.count({
            where: { member_id: freshStreak.member_id },
          });
          await this.sendNotificationWithCooldown(
            freshStreak.member_id,
            newRisk,
            now,
            {
              name: streak.member.display_name,
              gymName: streak.member.gym.name,
              totalVisits,
            },
          );
        }
      }
    }

    console.log(
      `[InactivityWorker] Processed ${streaks.length} members at ${now.toISOString()}`,
    );
  }

  private async sendNotificationWithCooldown(
    memberId: string,
    riskLevel: RiskLevel,
    now: Date,
    context: { name: string; gymName: string; totalVisits: number },
  ) {
    const notifType = `inactivity_${riskLevel}`;
    const recent = await this.prisma.notificationLog.findFirst({
      where: {
        member_id: memberId,
        notification_type: notifType,
        cooldown_until: { gte: now },
      },
    });

    if (recent) {
      return;
    }

    const cooldownHours = riskLevel === 'lapsed' ? 168 : 48;
    await this.prisma.notificationLog.create({
      data: {
        member_id: memberId,
        notification_type: notifType,
        cooldown_until: new Date(
          now.getTime() + cooldownHours * 60 * 60 * 1000,
        ),
      },
    });

    await this.pushService.sendInactivityNotification(
      memberId,
      getInactivityMessage(riskLevel, context),
    );
  }
}

function shouldNotify(newRisk: string, oldRisk: string) {
  const levels = ['active', 'at_risk', 'high_risk', 'lapsed'];
  return levels.indexOf(newRisk) > levels.indexOf(oldRisk);
}
