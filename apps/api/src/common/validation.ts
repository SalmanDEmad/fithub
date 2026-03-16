import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  payload: unknown,
): z.infer<T> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new BadRequestException(issue?.message || 'Invalid request payload');
  }

  return result.data;
}
