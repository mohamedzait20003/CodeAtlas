import { BaseController } from '@/shared/Domain/base.controller';

/** Route prefix for the AI-model catalog endpoint. */
export const AI_MODELS_ROUTE = 'ai-models';
export const BILLING_ROUTE = 'billing';
/** Route prefix for the public pricing catalog. */
export const PLANS_ROUTE = 'plans';

export abstract class SubscriptionBaseController extends BaseController {}
