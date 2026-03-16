import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InactivityMessage } from '@fithub/shared';

interface ExpoPushResponse {
  data?: Array<{
    status: 'ok' | 'error';
    details?: {
      error?: string;
    };
  }>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    payload: {
      expo_push_token: string;
      platform: 'ios' | 'android' | 'web';
      device_name?: string | null;
    },
  ) {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId },
      orderBy: { joined_at: 'asc' },
    });

    if (!member) {
      throw new NotFoundException('Member record not found');
    }

    return this.prisma.pushDevice.upsert({
      where: { expo_push_token: payload.expo_push_token },
      update: {
        member_id: member.id,
        platform: payload.platform,
        device_name: payload.device_name ?? null,
        disabled_at: null,
        updated_at: new Date(),
      },
      create: {
        member_id: member.id,
        expo_push_token: payload.expo_push_token,
        platform: payload.platform,
        device_name: payload.device_name ?? null,
      },
    });
  }

  async unregisterDevice(userId: string, expoPushToken: string) {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId },
      orderBy: { joined_at: 'asc' },
    });

    if (!member) {
      throw new NotFoundException('Member record not found');
    }

    return this.prisma.pushDevice.updateMany({
      where: {
        member_id: member.id,
        expo_push_token: expoPushToken,
      },
      data: {
        disabled_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async sendInactivityNotification(memberId: string, message: InactivityMessage) {
    const devices = await this.prisma.pushDevice.findMany({
      where: {
        member_id: memberId,
        disabled_at: null,
      },
    });

    if (devices.length === 0) {
      return;
    }

    const payload = devices.map((device) => ({
      to: device.expo_push_token,
      title: message.title,
      body: message.body,
      sound: 'default',
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const now = new Date();
      await this.prisma.pushDevice.updateMany({
        where: { member_id: memberId, disabled_at: null },
        data: {
          last_error_at: now,
          updated_at: now,
        },
      });
      this.logger.warn(`Expo push API returned ${response.status} for member ${memberId}`);
      return;
    }

    const result = (await response.json()) as ExpoPushResponse;
    const data = result.data ?? [];
    const now = new Date();

    for (let index = 0; index < devices.length; index += 1) {
      const device = devices[index];
      const ticket = data[index];
      if (!ticket || ticket.status === 'ok') {
        await this.prisma.pushDevice.update({
          where: { id: device.id },
          data: {
            last_sent_at: now,
            updated_at: now,
          },
        });
        continue;
      }

      const shouldDisable = ticket.details?.error === 'DeviceNotRegistered';
      await this.prisma.pushDevice.update({
        where: { id: device.id },
        data: {
          last_error_at: now,
          disabled_at: shouldDisable ? now : device.disabled_at,
          updated_at: now,
        },
      });
    }
  }
}
