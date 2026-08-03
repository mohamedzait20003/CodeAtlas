import { User } from '@/modules/identity/entities/user.entity';
import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Token } from '@/modules/identity/entities/token.entity';
import { Session } from '@/modules/identity/entities/session.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Resume } from '@/modules/resumes/entities/resume.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { AuditLog } from '@/modules/analytics/entities/audit-log.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PaymentEvent } from '@/modules/subscription/entities/payment-event.entity';

/** Single source of truth for the TypeORM entity set (API + workers). */
export const ENTITIES = [
  User,
  UserProfile,
  Token,
  Session,
  Plan,
  Subscription,
  UsageCounter,
  AiModel,
  Resume,
  Repo,
  PersonaComposition,
  ProjectComposition,
  AuditLog,
  PlanPrice,
  PaymentEvent,
];
