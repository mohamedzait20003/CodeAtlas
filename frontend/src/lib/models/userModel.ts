import type { BaseRequest, ApiResponse } from "./baseModel";

export type Role = "user" | "support" | "super_admin";

export interface PlanFeatures {
  privateRepos: boolean;
  bulkGenerate: boolean;
  directPush: boolean;
  watermark: boolean;
  /** Monthly "Compose Your Profile" runs (profile README). -1 = unlimited */
  profileCompositions: number;
  /** 0 = none, -1 = unlimited */
  customTemplates: number;
  /** -1 = unlimited */
  historyRetentionDays: number;
  apiAccess: boolean;
}

export interface Plan {
  tier: "free" | "starter" | "pro";
  priceMonthly: number;

  /** -1 = unlimited */
  repoLimit: number;

  /** -1 = unlimited */
  generationLimit: number;
  modelTier: "economy" | "standard" | "premium";
  features: PlanFeatures;
}

export interface Subscription {
  id: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  currentPeriodEnd: string | null;
  plan: Plan;
}

/** A currently-active session for the account (device + where signed in). */
export interface ActiveSession {
  location: string | null;
  deviceType: string | null;
}

export interface UserProfile {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  githubLogin: string | null;
  /** Whether a GitHub account is linked (repos can be synced). */
  githubLinked: boolean;
  sessions: ActiveSession[];
  subscription: Subscription | null;
}

// ─── Requests ────────────────────────────────────────────────────────────────

export interface SignUpRequest extends BaseRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignInRequest extends BaseRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest extends BaseRequest {
  email: string;
}

export interface ResetPasswordRequest extends BaseRequest {
  token: string;
  password: string;
}

export interface EmailVerifyRequest extends BaseRequest {
  token: string;
}

/** Sent to POST /auth/github after GitHub redirects back with ?code&state. */
export interface GithubExchangeRequest extends BaseRequest {
  code: string;
  state: string;
}

// ─── Responses ───────────────────────────────────────────────────────────────

/** Active-session descriptor as returned by the auth endpoints. */
export interface SessionInfo {
  Location: string | null;
  DeviceType: string | null;
}

export interface AuthProfile {
  Email: string | null;
  Name: string | null;
  AvatarUrl: string | null;
  GithubLinked: boolean;
  Sessions: SessionInfo[];
}

/** Returned by both /auth/sign-in and /auth/github/callback. */
export interface AuthResponseData {
  AccessToken: string;
  Role: Role;
  Profile: AuthProfile;
}

/** Returned by /auth/refresh. */
export interface RefreshResponseData {
  AccessToken: string;
}

export type AuthResponse = ApiResponse<AuthResponseData>;
export type RefreshResponse = ApiResponse<RefreshResponseData>;
