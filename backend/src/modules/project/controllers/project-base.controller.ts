import { BaseController } from '@/shared/Domain/base.controller';

/** Route prefix shared by every project ("Compose a README") endpoint. */
export const REPOS_ROUTE = 'repos';

export abstract class ProjectBaseController extends BaseController {}
