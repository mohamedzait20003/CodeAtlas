import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';

import { Resume } from '@/modules/resumes/entities/resume.entity';
import { ResumeSource } from '@/shared/Domain/enums/resume-source.enum';
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
 * link. Unlimited on every plan: consumption is metered in weekly credits, so
 * there is no reason to cap what a user stores.
 *
 * The DB stores only the R2 object key for uploads (never a URL); downloads are
 * served as short-lived presigned URLs.
 */
@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(Resume) private readonly resumes: Repository<Resume>,
    private readonly storage: R2StorageService,
  ) {}

  async list(userId: string): Promise<ResumeListView> {
    const rows = await this.resumes.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { Items: rows.map((r) => this.toView(r)), Limit: -1 };
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
