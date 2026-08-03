import { Controller, Get } from '@nestjs/common';

import {
  AI_MODELS_ROUTE,
  SubscriptionBaseController,
} from './subscription-base.controller';
import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import { ModelsService } from '@/modules/subscription/services/models.service';
import type { AiModelView } from '@/modules/subscription/dto/ai-model.dto';

/** Models the signed-in user may pick from (enabled + within their plan tier). */
@Controller(AI_MODELS_ROUTE)
export class AiModelsController extends SubscriptionBaseController {
  constructor(private readonly models: ModelsService) {
    super();
  }

  @Roles(UserRole.USER)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AiModelView[]> {
    return this.models.available(user.userId);
  }
}
