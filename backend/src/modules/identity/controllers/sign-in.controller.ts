import {
  Body,
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
import { AuthService } from '@/modules/identity/services/auth.service';
import { SignInDto } from '@/modules/identity/dto/sign-in.dto';
import { AuthThrottle } from '@/shared/Decorators/auth-throttle.decorator';

@Controller(AUTH_ROUTE)
@AuthThrottle()
export class SignInController extends IdentityBaseController {
  private readonly refreshCookieName: string;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    super();
    this.refreshCookieName = this.config.get<string>('auth.refreshCookieName')!;
  }

  /**
   * Authenticates an email+password account.
   * Returns { AccessToken, Role, Profile } — refresh token goes to HttpOnly cookie.
   */
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, responseData } = await this.authService.signIn(dto, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.cookie(this.refreshCookieName, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1_000,
      path: '/api/v1/auth',
    });

    return this.ok(responseData, 'Signed in successfully.');
  }
}
