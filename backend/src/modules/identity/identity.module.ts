import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '@/modules/identity/entities/user.entity';
import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Token } from '@/modules/identity/entities/token.entity';
import { Session } from '@/modules/identity/entities/session.entity';

import { TokenService } from '@/modules/identity/services/token.service';
import { AuthService } from '@/modules/identity/services/auth.service';
import { SessionService } from '@/modules/identity/services/session.service';
import { VerificationService } from '@/modules/identity/services/verification.service';
import { EncryptionService } from '@/shared/Services/encryption.service';
import { MailFactory } from '@/modules/identity/factories/Mail.Factory';

import { TOKEN_SERVICE } from '@/shared/Contracts/token-service.contract';

import { GithubController } from '@/modules/identity/controllers/github.controller';
import { SignUpController } from '@/modules/identity/controllers/sign-up.controller';
import { SignInController } from '@/modules/identity/controllers/sign-in.controller';
import { ForgotPasswordController } from '@/modules/identity/controllers/forgot-password.controller';
import { ResetPasswordController } from '@/modules/identity/controllers/reset-password.controller';
import { RefreshController } from '@/modules/identity/controllers/refresh.controller';
import { EmailVerifyController } from '@/modules/identity/controllers/email-verify.controller';
import { LogoutController } from '@/modules/identity/controllers/logout.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Token, Session]),
    JwtModule.register({}),
  ],
  controllers: [
    GithubController,
    SignUpController,
    SignInController,
    ForgotPasswordController,
    ResetPasswordController,
    RefreshController,
    EmailVerifyController,
    LogoutController,
  ],
  providers: [
    TokenService,
    { provide: TOKEN_SERVICE, useExisting: TokenService },
    AuthService,
    SessionService,
    VerificationService,
    EncryptionService,
    MailFactory,
  ],
  // EncryptionService is exported so other modules can decrypt the stored
  // GitHub OAuth token (e.g. repos) via the shared implementation.
  exports: [TokenService, TOKEN_SERVICE, EncryptionService],
})
export class IdentityModule {}
