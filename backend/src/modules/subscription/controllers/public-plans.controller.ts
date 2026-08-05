import { Controller, Get, Query } from '@nestjs/common';

import type { ApiResponse } from '@/shared/Domain/base.controller';
import { PlansService } from '@/modules/subscription/services/plans.service';
import type { PlanView } from '@/modules/subscription/dto/billing.dto';
import {
  PLANS_ROUTE,
  SubscriptionBaseController,
} from './subscription-base.controller';

/**
 * GET /plans — the public pricing catalog.
 *
 * Deliberately unauthenticated (no `@Roles`): the marketing pricing page is
 * public, so it can't use the signed-in `/billing/plans`. Prices come from the
 * requested region's gateway, or the configured default region.
 */
@Controller(PLANS_ROUTE)
export class PublicPlansController extends SubscriptionBaseController {
  constructor(private readonly plans: PlansService) {
    super();
  }

  @Get()
  async list(
    @Query('region') region?: string,
  ): Promise<ApiResponse<PlanView[]>> {
    return this.ok(await this.plans.catalog(region ?? null));
  }
}
