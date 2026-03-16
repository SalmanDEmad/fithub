import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  createGymSchema,
  gymInviteSchema,
  joinGymSchema,
  updateGymSettingsSchema,
} from '@fithub/validation';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { parseBody } from '../../common/validation';
import { PrismaService } from '../prisma/prisma.service';

@Controller('gyms')
@UseGuards(SupabaseAuthGuard)
export class GymController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async createGym(@Req() req: any, @Body() body: unknown) {
    const userId = req.userId as string;
    const payload = parseBody(createGymSchema, body);
    const slug = payload.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const existing = await this.prisma.gym.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Slug already taken');
    }

    const gym = await this.prisma.gym.create({
      data: {
        name: payload.name.trim(),
        slug,
      },
    });

    const member = await this.prisma.member.create({
      data: {
        user_id: userId,
        gym_id: gym.id,
        display_name: `${payload.name.trim()} Owner`,
        role: 'owner',
      },
    });

    await this.prisma.memberStreak.create({
      data: {
        member_id: member.id,
        week_start: getWeekStart(new Date()),
        rest_week_balance: 0,
      },
    });

    const invite = await this.prisma.gymInvite.create({
      data: { gym_id: gym.id },
    });

    return { gym, invite_code: invite.code };
  }

  @Post('join')
  async joinGym(@Req() req: any, @Body() body: unknown) {
    const userId = req.userId as string;
    const payload = parseBody(joinGymSchema, body);

    const invite = await this.prisma.gymInvite.findUnique({
      where: { code: payload.invite_code.trim() },
    });

    if (!invite) throw new BadRequestException('Invalid invite code');
    if (invite.expires_at && invite.expires_at < new Date()) {
      throw new BadRequestException('Invite expired');
    }
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      throw new BadRequestException('Invite maxed out');
    }

    const existing = await this.prisma.member.findUnique({
      where: { user_id_gym_id: { user_id: userId, gym_id: invite.gym_id } },
    });
    if (existing) {
      throw new BadRequestException('Already a member of this gym');
    }

    const member = await this.prisma.member.create({
      data: {
        user_id: userId,
        gym_id: invite.gym_id,
        display_name: payload.display_name.trim(),
      },
    });

    await this.prisma.memberStreak.create({
      data: {
        member_id: member.id,
        week_start: getWeekStart(new Date()),
        rest_week_balance: 0,
      },
    });

    await this.prisma.gymInvite.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } },
    });

    return member;
  }

  @Post('invites')
  async createInvite(@Req() req: any, @Body() body: unknown) {
    const userId = req.userId as string;
    const payload = parseBody(gymInviteSchema, body ?? {});
    const ownerMembership = await this.assertAdminGym(userId);

    const invite = await this.prisma.gymInvite.create({
      data: {
        gym_id: ownerMembership.gym_id,
        max_uses: payload.max_uses ?? null,
        expires_at: payload.expires_at ? new Date(payload.expires_at) : null,
      },
    });

    return invite;
  }

  @Delete('invites/:inviteId')
  async revokeInvite(@Req() req: any, @Param('inviteId') inviteId: string) {
    const userId = req.userId as string;
    const ownerMembership = await this.assertAdminGym(userId);

    const invite = await this.prisma.gymInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.gym_id !== ownerMembership.gym_id) {
      throw new BadRequestException('Invite not found');
    }

    await this.prisma.gymInvite.delete({
      where: { id: inviteId },
    });

    return { success: true };
  }

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() body: unknown) {
    const userId = req.userId as string;
    const payload = parseBody(updateGymSettingsSchema, body);
    const ownerMembership = await this.assertAdminGym(userId);

    const gym = await this.prisma.gym.update({
      where: { id: ownerMembership.gym_id },
      data: {
        name: payload.name.trim(),
        timezone: payload.timezone.trim(),
        weekly_visit_goal: payload.weekly_visit_goal,
        avg_membership_fee: payload.avg_membership_fee,
      },
    });

    return gym;
  }

  private async assertAdminGym(userId: string) {
    const membership = await this.prisma.member.findFirst({
      where: {
        user_id: userId,
        role: { in: ['admin', 'owner'] },
      },
      orderBy: { joined_at: 'asc' },
    });

    if (!membership) {
      throw new BadRequestException('Admin membership not found');
    }

    return membership;
  }
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
