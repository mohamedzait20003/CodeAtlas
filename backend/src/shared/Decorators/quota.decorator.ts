import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { QUOTA_KEY, QuotaGuard } from '@/shared/Guards/quota.guard';
import { QuotaKind } from '@/shared/Domain/enums/quota-kind.enum';

/**
 * Reserves a metered action for the authenticated user before the handler runs
 * (403 when the plan cap is reached). Designed like `@Roles(...)`:
 *
 *   @Quota(QuotaKind.PROFILE_COMPOSITION)
 *   @Roles(UserRole.USER)   // keep below @Quota — AuthGuard must run first
 *   @Post()
 *
 * The consuming module registers QuotaGuard + QuotaService (+ PlansService).
 */
export function Quota(kind: QuotaKind) {
  return applyDecorators(UseGuards(QuotaGuard), SetMetadata(QUOTA_KEY, kind));
}
