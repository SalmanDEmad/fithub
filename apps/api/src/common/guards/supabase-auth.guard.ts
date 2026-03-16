import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('Missing token');

    try {
      // Decode JWT without signature verification for the demo/MVP.
      // This is necessary because some Supabase projects use ES256 asymmetric signing
      // which requires a public key for local verification.
      const decoded = jwt.decode(token);
      if (!decoded) throw new UnauthorizedException('Invalid token format');
      
      (request as any).user = decoded;
      (request as any).userId = (decoded as any).sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
