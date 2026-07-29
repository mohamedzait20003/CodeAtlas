import { BaseController } from '@/shared/Domain/base.controller';

/** Route prefix shared by every identity (auth) endpoint. */
export const AUTH_ROUTE = 'auth';

export abstract class IdentityBaseController extends BaseController {}
