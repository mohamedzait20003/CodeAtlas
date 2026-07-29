import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AUTH_ROUTE, IdentityBaseController } from './identity-base.controller';
import { SessionService } from '@/modules/identity/services/session.service';
import { AuthThrottle } from '@/shared/Decorators/auth-throttle.decorator';

@Controller(AUTH_ROUTE)
@AuthThrottle()
export class LogoutController extends IdentityBaseController {
  private readonly refreshCookieName: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly config: ConfigService,
  ) {
    super();
    this.refreshCookieName = this.config.get<string>('auth.refreshCookieName')!;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined>;
    const refreshToken: string | undefined = cookies[this.refreshCookieName];

    await this.sessionService.logout(refreshToken);

    res.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });

    return this.message('Signed out successfully.');
  }
}
