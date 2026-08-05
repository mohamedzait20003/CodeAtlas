import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CREDITS_KEY, CreditsGuard } from '@/shared/Guards/credits.guard';
import { CreditAction } from '@/shared/Domain/enums/credit-action.enum';

/**
 * Holds the action's credit estimate for the authenticated user before the
 * handler runs (403 when the week's balance can't cover it). Designed like
 * `@Roles(...)`:
 *
 *   @Credits(CreditAction.PROFILE_COMPOSITION)
 *   @Roles(UserRole.USER)   // keep below @Credits — AuthGuard must run first
 *   @Post()
 *
 * The consuming module registers CreditsGuard + CreditsService (+ PlansService).
 */
export function Credits(action: CreditAction) {
  return applyDecorators(
    UseGuards(CreditsGuard),
    SetMetadata(CREDITS_KEY, action),
  );
}

/**
 * Injects the credits `CreditsGuard` just held, so the handler can record them
 * on the run it creates. Only meaningful on routes carrying `@Credits(...)`.
 *
 *   start(@HeldCredits() held: number) { ... }
 */
export const HeldCredits = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.creditsHeld ?? 0;
  },
);
