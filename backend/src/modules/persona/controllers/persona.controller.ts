import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { Quota } from '@/shared/Decorators/quota.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import { QuotaKind } from '@/shared/Domain/enums/quota-kind.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import {
  BaseController,
  type ApiResponse,
} from '@/shared/Domain/base.controller';
import { PersonaCompositionService } from '@/modules/persona/services/persona-composition.service';
import { PersonaTailorService } from '@/modules/persona/services/persona-tailor.service';
import { StartCompositionDto } from '@/modules/persona/dto/start-composition.dto';
import { TailorCompositionDto } from '@/modules/persona/dto/tailor-composition.dto';
import { CommitCompositionDto } from '@/modules/persona/dto/commit-composition.dto';
import type {
  CommitView,
  CompositionStartView,
  CompositionView,
  TailorView,
} from '@/modules/persona/dto/composition.dto';

@Controller('compositions')
export class PersonaController extends BaseController {
  constructor(
    private readonly composition: PersonaCompositionService,
    private readonly tailorService: PersonaTailorService,
  ) {
    super();
  }

  @Quota(QuotaKind.PROFILE_COMPOSITION)
  @Roles(UserRole.USER)
  @Post()
  async start(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartCompositionDto,
  ): Promise<ApiResponse<CompositionStartView>> {
    return this.ok(
      await this.composition.start(user.userId, dto),
      'Composition started.',
    );
  }

  @Roles(UserRole.USER)
  @Post('tailor')
  async tailor(
    @Body() dto: TailorCompositionDto,
  ): Promise<ApiResponse<TailorView>> {
    return this.ok(await this.tailorService.tailor(dto.draft));
  }

  @Roles(UserRole.USER)
  @Get(':id')
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<CompositionView>> {
    return this.ok(await this.composition.status(user.userId, id));
  }

  @Roles(UserRole.USER)
  @Post(':id/commit')
  async commit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommitCompositionDto,
  ): Promise<ApiResponse<CommitView>> {
    return this.ok(
      await this.composition.commit(user.userId, id, dto.content),
      'Committed to your profile.',
    );
  }
}
