import { Body, Controller, Post } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { BillingService } from '@/modules/subscription/services/billing.service';
import { StartCheckoutDto } from '@/modules/subscription/dto/billing.dto';
import type { CheckoutView } from '@/modules/subscription/dto/billing.dto';
import {
  BILLING_ROUTE,
  SubscriptionBaseController,
} from './subscription-base.controller';

/** POST /billing/checkout — hosted-checkout URL for the tier/interval, via the
 * region's gateway. */
@Controller(BILLING_ROUTE)
export class CheckoutController extends SubscriptionBaseController {
  constructor(private readonly billing: BillingService) {
    super();
  }

  @Roles(UserRole.USER)
  @Post('checkout')
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartCheckoutDto,
  ): Promise<ApiResponse<CheckoutView>> {
    return this.ok(await this.billing.createCheckout(user.userId, dto));
  }
}
