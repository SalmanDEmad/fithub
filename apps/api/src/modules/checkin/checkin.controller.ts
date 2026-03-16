import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CHECKIN_DEDUP_WINDOW_MS,
  QR_MAX_AGE_S,
  QR_ROTATION_INTERVAL_S,
} from '@fithub/shared';
import { manualCheckinSchema, scanCheckinSchema } from '@fithub/validation';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { parseBody } from '../../common/validation';
import { PrismaService } from '../prisma/prisma.service';
import { StreakService } from '../streak/streak.service';

@Controller('checkin')
@UseGuards(SupabaseAuthGuard)
export class CheckinController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streakService: StreakService,
  ) {}

  @Get('qr/:gymId')
  async getQrPayload(@Req() req: any, @Param('gymId') gymId: string) {
    const userId = req.userId as string;

    const member = await this.prisma.member.findFirst({
      where: {
        user_id: userId,
        gym_id: gymId,
        role: { in: ['admin', 'owner'] },
      },
    });
    if (!member) {
      throw new BadRequestException('Not an admin of this gym');
    }

    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new BadRequestException('Gym not found');
    }

    const payload = generateQrPayload(gym.id, gym.qr_secret);
    return { payload, expires_in: QR_ROTATION_INTERVAL_S };
  }

  @Post('scan')
  async scanCheckin(@Req() req: any, @Body() body: unknown) {
    const userId = req.userId as string;
    const payload = parseBody(scanCheckinSchema, body);
    const parsed = parseQrPayload(payload.qr_payload);

    if (!parsed) {
      throw new BadRequestException('Invalid QR code format');
    }

    const gym = await this.prisma.gym.findUnique({
      where: { id: parsed.gymId },
    });
    if (!gym) {
      throw new BadRequestException('Gym not found');
    }

    if (
      !verifyQrPayload(
        parsed.gymId,
        parsed.timestamp,
        parsed.hmac,
        gym.qr_secret,
      )
    ) {
      throw new BadRequestException('Invalid or expired QR code');
    }

    const age = Math.floor(Date.now() / 1000) - parsed.timestamp;
    if (age > QR_MAX_AGE_S) {
      throw new BadRequestException('QR code expired');
    }

    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gym.id },
    });
    if (!member) {
      throw new BadRequestException('Not a member of this gym');
    }

    await this.assertDedupWindow(member.id);

    const event = await this.prisma.attendanceEvent.create({
      data: { member_id: member.id, method: 'qr' },
    });

    const effectiveGoal = this.streakService.getEffectiveGoal(
      member.personal_weekly_goal,
      gym.weekly_visit_goal,
    );

    await this.streakService.applyCheckin(member.id, gym.timezone, effectiveGoal);

    const totalCheckins = await this.prisma.attendanceEvent.count({
      where: { member_id: member.id },
    });

    return {
      success: true,
      event_id: event.id,
      total_checkins: totalCheckins,
      first_checkin_completed: totalCheckins === 1,
      should_resurface_push_prompt: totalCheckins === 3,
    };
  }

  @Post('manual')
  async manualCheckin(@Req() req: any, @Body() body: unknown) {
    const userId = req.userId as string;
    const payload = parseBody(manualCheckinSchema, body);

    const targetMember = await this.prisma.member.findUnique({
      where: { id: payload.member_id },
      include: { gym: true },
    });
    if (!targetMember) {
      throw new BadRequestException('Member not found');
    }

    const callerMember = await this.prisma.member.findFirst({
      where: {
        user_id: userId,
        gym_id: targetMember.gym_id,
        role: { in: ['admin', 'owner'] },
      },
    });
    if (!callerMember) {
      throw new BadRequestException('Not authorized');
    }

    await this.assertDedupWindow(targetMember.id);

    const event = await this.prisma.attendanceEvent.create({
      data: { member_id: targetMember.id, method: 'manual' },
    });

    const effectiveGoal = this.streakService.getEffectiveGoal(
      targetMember.personal_weekly_goal,
      targetMember.gym.weekly_visit_goal,
    );

    await this.streakService.applyCheckin(
      targetMember.id,
      targetMember.gym.timezone,
      effectiveGoal,
    );

    return { success: true, event_id: event.id };
  }

  private async assertDedupWindow(memberId: string) {
    const dedupCutoff = new Date(Date.now() - CHECKIN_DEDUP_WINDOW_MS);
    const recent = await this.prisma.attendanceEvent.findFirst({
      where: {
        member_id: memberId,
        checked_in_at: { gte: dedupCutoff },
      },
    });

    if (recent) {
      throw new BadRequestException('Already checked in recently');
    }
  }
}

function generateQrPayload(gymId: string, secret: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const window = Math.floor(ts / QR_ROTATION_INTERVAL_S) * QR_ROTATION_INTERVAL_S;
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`${gymId}:${window}`)
    .digest('hex')
    .substring(0, 16);
  return `${gymId}:${window}:${hmac}`;
}

function parseQrPayload(
  payload: string,
): { gymId: string; timestamp: number; hmac: string } | null {
  const parts = payload.split(':');
  if (parts.length !== 3) return null;
  const timestamp = Number.parseInt(parts[1], 10);
  if (Number.isNaN(timestamp)) return null;
  return { gymId: parts[0], timestamp, hmac: parts[2] };
}

function verifyQrPayload(
  gymId: string,
  timestamp: number,
  hmac: string,
  secret: string,
) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${gymId}:${timestamp}`)
    .digest('hex')
    .substring(0, 16);

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
  } catch {
    return false;
  }
}
