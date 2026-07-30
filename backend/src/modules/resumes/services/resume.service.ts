import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';

import { Resume } from '@/modules/resumes/entities/resume.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { ResumeSource } from '@/shared/Domain/enums/resume-source.enum';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import { R2StorageService } from '@/shared/Services/r2-storage.service';
import type { CreateResumeDto } from '@/modules/resumes/dto/create-resume.dto';
import type {
  ResumeListView,
  ResumeView,
  UploadedResumeFile,
} from '@/modules/resumes/dto/resume.dto';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/**
 * Saved résumés — an uploaded file (stored in Cloudflare R2) or an external
 * link. The number a user may keep is capped by their plan (Plan.resumeLimit):
 * Free 1, Starter 5, Pro unlimited. To swap on a capped plan, delete first.
 *
 * The DB stores only the R2 object key for uploads (never a URL); downloads are
 * served as short-lived presigned URLs.
 */
@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(Resume) private readonly resumes: Repository<Resume>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    private readonly storage: R2StorageService,
  ) {}

  async list(userId: string): Promise<ResumeListView> {
    const [rows, limit] = await Promise.all([
      this.resumes.find({ where: { userId }, order: { createdAt: 'DESC' } }),
      this.resumeLimit(userId),
    ]);
    return { Items: rows.map((r) => this.toView(r)), Limit: limit };
  }

  async create(
    userId: string,
    dto: CreateResumeDto,
    file?: UploadedResumeFile,
  ): Promise<ResumeView> {
    const hasFile = Boolean(file);
    const hasUrl = Boolean(dto.url);
    if (hasFile === hasUrl) {
      throw new BadRequestException(
        'Provide either a file upload or a link URL — exactly one.',
      );
    }

    await this.assertUnderLimit(userId);

    const row = file
      ? await this.buildUpload(userId, file)
      : this.resumes.create({
          userId,
          source: ResumeSource.LINK,
          fileUrl: dto.url!,
        });

    return this.toView(await this.resumes.save(row));
  }

  async remove(userId: string, id: string): Promise<void> {
    const resume = await this.resumes.findOne({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Résumé not found.');

    await this.resumes.remove(resume);
    if (resume.source === ResumeSource.UPLOAD) {
      // Best-effort object cleanup; the row is already gone either way.
      await this.storage.delete(resume.fileUrl).catch(() => undefined);
    }
  }

  /** A URL the caller can download: presigned (uploads) or the link itself. */
  async downloadUrl(userId: string, id: string): Promise<string> {
    const resume = await this.resumes.findOne({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Résumé not found.');

    if (resume.source === ResumeSource.LINK) return resume.fileUrl;
    return this.storage.presignDownload(
      resume.fileUrl,
      resume.fileName,
      resume.mimeType,
    );
  }

  /** Validates + uploads the file to R2 and returns the unsaved entity. */
  private async buildUpload(
    userId: string,
    file: UploadedResumeFile,
  ): Promise<Resume> {
    this.validateFile(file);
    const key = `resumes/${userId}/${randomUUID()}${extname(
      file.originalname,
    ).toLowerCase()}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    return this.resumes.create({
      userId,
      source: ResumeSource.UPLOAD,
      fileUrl: key,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  /** Free 1 / Starter 5 / Pro unlimited (-1) — enforced before create. */
  private async assertUnderLimit(userId: string): Promise<void> {
    const limit = await this.resumeLimit(userId);
    if (limit === -1) return;

    const count = await this.resumes.count({ where: { userId } });
    if (count >= limit) {
      throw new ConflictException(
        `Your plan allows ${limit} saved résumé${
          limit === 1 ? '' : 's'
        }. Delete one to add another.`,
      );
    }
  }

  private async resumeLimit(userId: string): Promise<number> {
    const subscription = await this.subscriptions.findOne({
      where: { userId },
    });
    const plan =
      (subscription?.plan as Plan | undefined) ??
      (await this.plans.findOne({ where: { tier: PlanTier.FREE } }));
    return plan?.resumeLimit ?? 1;
  }

  private validateFile(file: UploadedResumeFile): void {
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Résumé must be 5 MB or smaller.');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Résumé must be a PDF or Word document.');
    }
  }

  private toView(r: Resume): ResumeView {
    return {
      Id: r.id,
      Source: r.source,
      Url: r.source === ResumeSource.LINK ? r.fileUrl : null,
      Name: r.fileName,
      CreatedAt: r.createdAt.toISOString(),
    };
  }
}
