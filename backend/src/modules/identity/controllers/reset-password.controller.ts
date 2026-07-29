import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AUTH_ROUTE, IdentityBaseController } from './identity-base.controller';
import { VerificationService } from '@/modules/identity/services/verification.service';
import { ResetPasswordDto } from '@/modules/identity/dto/reset-password.dto';
import { AuthThrottle } from '@/shared/Decorators/auth-throttle.decorator';

@Controller(AUTH_ROUTE)
@AuthThrottle()
export class ResetPasswordController extends IdentityBaseController {
  constructor(private readonly verificationService: VerificationService) {
    super();
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.verificationService.resetPassword(dto);
    return this.message(
      'Password updated. You can now sign in with your new password.',
    );
  }
}
