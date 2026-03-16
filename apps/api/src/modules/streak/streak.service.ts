import { Injectable } from '@nestjs/common';
import { MemberStreak } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StreakService {
  constructor(private readonly prisma: PrismaService) {}

  async applyCheckin(
    memberId: string,
    gymTimezone: string,
    effectiveGoal: number,
    now = new Date(),
  ) {
    const weekStart = this.getWeekStartInTimezone(now, gymTimezone);
    const existing = await this.prisma.memberStreak.findUnique({
      where: { member_id: memberId },
    });

    if (!existing) {
      const metGoalImmediately = effectiveGoal <= 1;
      return this.prisma.memberStreak.create({
        data: {
          member_id: memberId,
          visits_this_week: 1,
          week_start: weekStart,
          last_visit_at: now,
          current_streak_weeks: metGoalImmediately ? 1 : 0,
          longest_streak_weeks: metGoalImmediately ? 1 : 0,
          risk_level: 'active',
          rest_week_balance: 0,
          updated_at: now,
        },
      });
    }

    const streak = await this.rolloverStreak(existing, gymTimezone, effectiveGoal, now);
    const nextVisits = streak.visits_this_week + 1;
    const justMetGoal =
      nextVisits >= effectiveGoal && streak.visits_this_week < effectiveGoal;
    const nextCurrentStreak = justMetGoal
      ? streak.current_streak_weeks + 1
      : streak.current_streak_weeks;
    const shouldAwardFreeze =
      justMetGoal &&
      nextCurrentStreak > 0 &&
      nextCurrentStreak % 4 === 0 &&
      streak.rest_week_balance < 2;

    return this.prisma.memberStreak.update({
      where: { member_id: memberId },
      data: {
        visits_this_week: nextVisits,
        week_start: weekStart,
        last_visit_at: now,
        current_streak_weeks: nextCurrentStreak,
        longest_streak_weeks: justMetGoal
          ? Math.max(streak.longest_streak_weeks, nextCurrentStreak)
          : streak.longest_streak_weeks,
        risk_level: 'active',
        rest_week_balance: shouldAwardFreeze
          ? Math.min(2, streak.rest_week_balance + 1)
          : streak.rest_week_balance,
        updated_at: now,
      },
    });
  }

  async rolloverForMember(
    memberId: string,
    gymTimezone: string,
    effectiveGoal: number,
    now = new Date(),
  ) {
    const streak = await this.prisma.memberStreak.findUnique({
      where: { member_id: memberId },
    });
    if (!streak) return null;
    return this.rolloverStreak(streak, gymTimezone, effectiveGoal, now);
  }

  async rolloverStreak(
    streak: MemberStreak,
    gymTimezone: string,
    effectiveGoal: number,
    now = new Date(),
  ) {
    const currentWeekStart = this.getWeekStartInTimezone(now, gymTimezone);
    let cursor = new Date(streak.week_start);
    let state = {
      ...streak,
      week_start: new Date(streak.week_start),
      rest_week_used_at: streak.rest_week_used_at
        ? new Date(streak.rest_week_used_at)
        : null,
    };
    let changed = false;

    while (cursor.getTime() < currentWeekStart.getTime()) {
      const metGoal = state.visits_this_week >= effectiveGoal;
      if (!metGoal) {
        if (state.rest_week_balance > 0) {
          state.rest_week_balance -= 1;
          state.rest_week_used_at = new Date(cursor);
        } else {
          state.current_streak_weeks = 0;
        }
      }

      cursor = this.addDays(cursor, 7);
      state.week_start = new Date(cursor);
      state.visits_this_week = 0;
      changed = true;
    }

    if (!changed) {
      return state;
    }

    return this.prisma.memberStreak.update({
      where: { member_id: streak.member_id },
      data: {
        current_streak_weeks: state.current_streak_weeks,
        longest_streak_weeks: state.longest_streak_weeks,
        visits_this_week: state.visits_this_week,
        week_start: state.week_start,
        rest_week_balance: state.rest_week_balance,
        rest_week_used_at: state.rest_week_used_at,
        updated_at: now,
      },
    });
  }

  getWeekStartInTimezone(date: Date, timezone: string) {
    const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const day = local.getDay();
    const diff = local.getDate() - day + (day === 0 ? -6 : 1);
    local.setDate(diff);
    local.setHours(0, 0, 0, 0);
    return local;
  }

  getEffectiveGoal(
    personalGoal: number | null | undefined,
    gymWeeklyGoal: number,
  ) {
    return personalGoal ?? gymWeeklyGoal;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
