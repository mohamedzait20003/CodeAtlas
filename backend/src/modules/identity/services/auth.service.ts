import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '@/modules/identity/entities/user.entity';
import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';

import { AuthResult } from '@/modules/identity/services/token.service';
import {
  SessionService,
  SessionContext,
} from '@/modules/identity/services/session.service';
import { VerificationService } from '@/modules/identity/services/verification.service';
import { EncryptionService } from '@/shared/Services/encryption.service';
import { SignUpDto } from '@/modules/identity/dto/sign-up.dto';
import { SignInDto } from '@/modules/identity/dto/sign-in.dto';

const BCRYPT_ROUNDS = 12;
export interface GithubUserData {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly adminEmailDomain: string;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    private readonly sessionService: SessionService,
    private readonly verificationService: VerificationService,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
  ) {
    this.adminEmailDomain = this.config.get<string>('auth.adminEmailDomain')!;
  }

  /**
   * Upserts a user from GitHub OAuth data, then starts a session.
   * Always sets emailVerifiedAt (GitHub has already verified the email) and
   * creates the UserProfile on first login.
   */
  async githubAuth(
    data: GithubUserData,
    context?: SessionContext,
  ): Promise<AuthResult> {
    let user = await this.users.findOne({
      where: { githubId: String(data.id) },
    });

    // Store the OAuth token encrypted at rest (AES-256-GCM) for later Octokit use.
    const githubOauthTokenEnc = this.encryption.encrypt(data.accessToken);

    if (!user) {
      user = this.users.create({
        githubId: String(data.id),
        githubLogin: data.login,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url,
        githubOauthTokenEnc,
        role: UserRole.USER,
        emailVerifiedAt: new Date(),
      });
      await this.users.save(user);

      // Create the paired UserProfile (shared PK)
      await this.profiles.save(this.profiles.create({ id: user.id }));
    } else {
      // Keep GitHub data + token fresh on each sign-in
      await this.users.update(user.id, {
        githubLogin: data.login,
        email: data.email ?? user.email,
        name: data.name ?? user.name,
        avatarUrl: data.avatar_url,
        githubOauthTokenEnc,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      });
      user = (await this.users.findOne({ where: { id: user.id } }))!;
    }

    return this.sessionService.createSession(user, context);
  }

  /**
   * Creates an unverified account. Does NOT sign the user in — they must verify
   * their email first. Delegates the verification email to VerificationService.
   */
  async signUp(dto: SignUpDto): Promise<void> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email is already registered.');

    if (dto.email.endsWith(`@${this.adminEmailDomain}`)) {
      throw new BadRequestException(
        'Use the admin invitation flow for admin accounts.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.users.save(
      this.users.create({
        email: dto.email,
        name: dto.name ?? null,
        passwordHash,
        role: UserRole.USER,
        emailVerifiedAt: null,
      }),
    );

    await this.profiles.save(this.profiles.create({ id: user.id }));

    await this.verificationService.sendAccountVerification(user);
  }

  async signIn(dto: SignInDto, context?: SessionContext): Promise<AuthResult> {
    const user = await this.users.findOne({ where: { email: dto.email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email not verified. Check your inbox.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials.');

    return this.sessionService.createSession(user, context);
  }
}
