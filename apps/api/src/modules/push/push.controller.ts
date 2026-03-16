import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { parseBody } from '../../common/validation';
import {
  registerPushDeviceSchema,
  unregisterPushDeviceSchema,
} from '@fithub/validation';
import { PushService } from './push.service';

@Controller('push')
@UseGuards(SupabaseAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  async register(@Req() req: any, @Body() body: unknown) {
    const payload = parseBody(registerPushDeviceSchema, body);
    await this.pushService.registerDevice(req.userId as string, payload);
    return { success: true };
  }

  @Post('unregister')
  async unregister(@Req() req: any, @Body() body: unknown) {
    const payload = parseBody(unregisterPushDeviceSchema, body);
    await this.pushService.unregisterDevice(
      req.userId as string,
      payload.expo_push_token,
    );
    return { success: true };
  }
}
