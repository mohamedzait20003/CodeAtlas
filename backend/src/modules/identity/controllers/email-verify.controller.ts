import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AUTH_ROUTE, IdentityBaseController } from './identity-base.controller';
import { VerificationService } from '@/modules/identity/services/verification.service';
import { EmailVerifyDto } from '@/modules/identity/dto/email-verify.dto';
import { AuthThrottle } from '@/shared/Decorators/auth-throttle.decorator';

@Controller(AUTH_ROUTE)
@AuthThrottle()
export class EmailVerifyController extends IdentityBaseController {
  constructor(private readonly verificationService: VerificationService) {
    super();
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: EmailVerifyDto) {
    await this.verificationService.verifyEmail(dto.token);
    return this.message('Email verified. You can now sign in.');
  }
}
