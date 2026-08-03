import { BaseController } from '@/shared/Domain/base.controller';

/** Route prefix for the AI-model catalog endpoint. */
export const AI_MODELS_ROUTE = 'ai-models';
export const BILLING_ROUTE = 'billing';

export abstract class SubscriptionBaseController extends BaseController {}
