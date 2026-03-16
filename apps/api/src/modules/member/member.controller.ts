import {
  Body,
  Controller,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { parseBody } from '../../common/validation';
import { updateMemberPreferencesSchema } from '@fithub/validation';
import { PrismaService } from '../prisma/prisma.service';

@Controller('members')
@UseGuards(SupabaseAuthGuard)
export class MemberController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch('me/preferences')
  async updatePreferences(@Req() req: any, @Body() body: unknown) {
    const payload = parseBody(updateMemberPreferencesSchema, body);
    const userId = req.userId as string;

    const member = await this.prisma.member.findFirst({
      where: { user_id: userId },
      orderBy: { joined_at: 'asc' },
    });

    if (!member) {
      throw new NotFoundException('Member record not found');
    }

    const updated = await this.prisma.member.update({
      where: { id: member.id },
      data: {
        personal_weekly_goal: payload.personal_weekly_goal,
      },
      select: {
        id: true,
        personal_weekly_goal: true,
      },
    });

    return updated;
  }
}
