import { Controller, Get } from '@nestjs/common';

import {
  BILLING_ROUTE,
  SubscriptionBaseController,
} from './subscription-base.controller';
import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { PlansService } from '@/modules/subscription/services/plans.service';
import type { PlanView } from '@/modules/subscription/dto/billing.dto';

/** GET /billing/plans — plans + prices for the caller's region gateway. */
@Controller(BILLING_ROUTE)
export class ListPlansController extends SubscriptionBaseController {
  constructor(private readonly plans: PlansService) {
    super();
  }

  @Roles(UserRole.USER)
  @Get('plans')
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<PlanView[]>> {
    return this.ok(await this.plans.listPlans(user.userId));
  }
}
