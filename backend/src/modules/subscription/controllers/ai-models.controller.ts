import { Controller, Get } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import { AiModelsService } from '@/modules/subscription/services/ai-models.service';
import type { AiModelView } from '@/modules/subscription/dto/ai-model.dto';

/** Models the signed-in user may pick from (enabled + within their plan tier). */
@Controller('ai-models')
export class AiModelsController {
  constructor(private readonly models: AiModelsService) {}

  @Roles(UserRole.USER)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AiModelView[]> {
    return this.models.available(user.userId);
  }
}
