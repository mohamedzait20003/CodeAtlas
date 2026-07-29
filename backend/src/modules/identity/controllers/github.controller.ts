import { randomBytes } from 'crypto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AUTH_ROUTE, IdentityBaseController } from './identity-base.controller';
import {
  AuthService,
  GithubUserData,
} from '@/modules/identity/services/auth.service';
import { GithubExchangeDto } from '@/modules/identity/dto/github-exchange.dto';
import { AuthThrottle } from '@/shared/Decorators/auth-throttle.decorator';

@Controller(AUTH_ROUTE)
@AuthThrottle()
export class GithubController extends IdentityBaseController {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private readonly refreshCookieName: string;
  private readonly stateCookieName = 'gh_oauth_state';

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    super();
    this.clientId = this.config.get<string>('auth.github.clientId')!;
    this.clientSecret = this.config.get<string>('auth.github.clientSecret')!;
    this.callbackUrl = this.config.get<string>('auth.github.callbackUrl')!;
    this.refreshCookieName = this.config.get<string>('auth.refreshCookieName')!;
  }

  /**
   * Starts the OAuth flow: sets a short-lived HttpOnly `state` cookie (CSRF) and
   * redirects the browser to GitHub. `redirect_uri` points at the FRONTEND
   * callback, which forwards the code back to POST /auth/github.
   * Uses res.redirect directly so the global ResponseInterceptor doesn't wrap it.
   */
  @Get('github')
  initiateOAuth(@Res() res: Response) {
    const state = randomBytes(16).toString('hex');

    res.cookie(this.stateCookieName, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1_000, // 10 minutes
      path: '/api/v1/auth',
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      // public_repo: create/update the public profile repo (owner/owner) on commit.
      scope: 'read:user user:email public_repo',
      state,
    });
    res.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
    );
  }

  /**
   * Completes the flow. The frontend callback forwards { code, state } here.
   * We verify `state` against the cookie, exchange the code for GitHub user
   * data, upsert the user, and return the SAME AuthResponse as email sign-in
   * (access token + role + profile) plus the HttpOnly refresh cookie.
   */
  @Post('github')
  @HttpCode(HttpStatus.OK)
  async exchange(
    @Body() dto: GithubExchangeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieState = (req.cookies as Record<string, string | undefined>)[
      this.stateCookieName
    ];
    if (!cookieState || cookieState !== dto.state) {
      throw new UnauthorizedException('Invalid or expired OAuth state.');
    }
    res.clearCookie(this.stateCookieName, { path: '/api/v1/auth' });

    const githubUser = await this.exchangeCode(dto.code);
    const { tokens, responseData } = await this.authService.githubAuth(
      githubUser,
      {
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    );

    this.setRefreshCookie(res, tokens.refreshToken);
    return this.ok(responseData, 'GitHub sign-in successful.');
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /** Exchanges an OAuth code for GitHub user data via the GitHub REST API. */
  private async exchangeCode(code: string): Promise<GithubUserData> {
    // Step 1: exchange code for access token
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.callbackUrl,
        }),
      },
    );

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('GitHub OAuth token exchange failed.');
    }

    const ghToken = tokenData.access_token;

    // Step 2: fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
    const user = (await userRes.json()) as {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
      avatar_url: string;
    };

    // Step 3: fetch primary verified email if not exposed on profile
    let email = user.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      email = emails.find((e) => e.primary && e.verified)?.email ?? null;
    }

    return {
      id: user.id,
      login: user.login,
      name: user.name,
      email,
      avatar_url: user.avatar_url,
      accessToken: ghToken,
    };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(this.refreshCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1_000, // 7 days in ms
      path: '/api/v1/auth',
    });
  }
}
