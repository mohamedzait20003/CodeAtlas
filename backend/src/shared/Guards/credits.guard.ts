import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { CreditAction } from '@/shared/Domain/enums/credit-action.enum';
import { CreditsService } from '@/modules/subscription/services/credits.service';

export const CREDITS_KEY = 'credits';

/**
 * Holds the action's credit estimate before the handler runs (403 when the
 * week's balance can't cover it). The amount held is stashed on the request so
 * the handler can record it on the run it creates — settlement later releases
 * exactly that much.
 */
@Injectable()
export class CreditsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly credits: CreditsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<CreditAction | undefined>(
      CREDITS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!action) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    req.creditsHeld = await this.credits.hold(req.user.userId, action);
    return true;
  }
}
