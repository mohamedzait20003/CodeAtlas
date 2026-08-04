import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { CancellationService } from '@/modules/subscription/services/cancellation.service';
import type { CancellationView } from '@/modules/subscription/dto/billing.dto';
import {
  BILLING_ROUTE,
  SubscriptionBaseController,
} from './subscription-base.controller';

/** POST /billing/cancel — apply the interval's cancellation policy. */
@Controller(BILLING_ROUTE)
export class CancelSubscriptionController extends SubscriptionBaseController {
  constructor(private readonly cancellation: CancellationService) {
    super();
  }

  @Roles(UserRole.USER)
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<CancellationView>> {
    return this.ok(
      await this.cancellation.cancel(user.userId),
      'Your subscription has been scheduled to end.',
    );
  }
}
