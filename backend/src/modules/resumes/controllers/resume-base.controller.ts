import { BaseController } from '@/shared/Domain/base.controller';

/** Route prefix shared by every résumé endpoint. */
export const RESUMES_ROUTE = 'resumes';

export abstract class ResumeBaseController extends BaseController {}
