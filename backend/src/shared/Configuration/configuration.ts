export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  app: {
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  auth: {
    /** Signing key for short-lived access tokens. */
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-access-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',

    /** Signing key for long-lived refresh tokens (separate from access). */
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-refresh-secret',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

    /**
     * HMAC key for the session digest embedded in both tokens.
     * Allows cross-validating an access/refresh pair with no DB hit.
     */
    digestSecret: process.env.DIGEST_SECRET ?? 'change-digest-secret',

    /** HttpOnly cookie name that carries the refresh token. */
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'rnt',

    /** AES-256 key (64 hex chars) for encrypting stored GitHub OAuth tokens. */
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? '',

    /** Required email domain suffix for support / super_admin role accounts. */
    adminEmailDomain: process.env.ADMIN_EMAIL_DOMAIN ?? 'codeatlasadmin.com',

    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ??
        'http://localhost:3000/auth/github/callback',
    },
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },

  billing: {
    /** Region used when a user has no country set (→ the default gateway). */
    defaultRegion: process.env.BILLING_DEFAULT_REGION ?? 'US',
    /** Where the gateway's hosted checkout returns the user. */
    successUrl:
      process.env.BILLING_SUCCESS_URL ??
      `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/customer/me/profile/billing?billing=success`,
    cancelUrl:
      process.env.BILLING_CANCEL_URL ??
      `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/customer/me/profile/billing?billing=cancelled`,
  },

  /** Cloudflare R2 (S3-compatible) — private bucket for résumé uploads. */
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET ?? '',
    /** Presigned download-URL lifetime (seconds). */
    presignExpiry: parseInt(process.env.R2_PRESIGN_EXPIRY ?? '900', 10),
  },

  mail: {
    /** 'smtp' sends via Nodemailer. 'log' prints to console — no SMTP needed in dev. */
    driver: process.env.MAIL_DRIVER ?? 'smtp',
    host: process.env.MAIL_HOST ?? 'localhost',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    username: process.env.MAIL_USERNAME ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    fromEmail: process.env.MAIL_FROM_EMAIL ?? 'noreply@codeatlas.com',
    fromName: process.env.MAIL_FROM_NAME ?? 'CodeAtlas',
    /** Filesystem directory for template overrides ({view}.hbs). */
    templatesPath: process.env.MAIL_TEMPLATES_PATH ?? '',
  },

  llm: {
    /** Primary provider for now — the composition agent runs on Gemini. */
    googleApiKey: process.env.GOOGLE_API_KEY ?? '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  },
});
