import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

import { Resume } from '@/modules/resumes/entities/resume.entity';
import { ResumeSource } from '@/shared/Domain/enums/resume-source.enum';
import { R2StorageService } from '@/shared/Services/r2-storage.service';

/** Cap the résumé text handed to the model. */
const MAX_TEXT = 12_000;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Extracts plain text from a saved résumé for the profile agent. Uploaded
 * files are fetched from R2 and parsed (PDF / Word); the result is cached in
 * `parsed_text` so re-runs skip the download + parse. Link résumés are passed
 * through as a note (we don't fetch arbitrary user URLs — SSRF).
 */
@Injectable()
export class ResumeTextService {
  private readonly logger = new Logger(ResumeTextService.name);

  constructor(
    @InjectRepository(Resume) private readonly resumes: Repository<Resume>,
    private readonly storage: R2StorageService,
  ) {}

  async extractText(resume: Resume): Promise<string | null> {
    if (resume.parsedText) return resume.parsedText;

    if (resume.source === ResumeSource.LINK) {
      return `Résumé available at: ${resume.fileUrl}`;
    }

    let text: string;
    try {
      const bytes = await this.storage.getBytes(resume.fileUrl);
      text = await this.parse(bytes, resume.mimeType);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Résumé ${resume.id} could not be parsed: ${message}`);
      return null;
    }

    if (!text) return null;
    const clipped = text.slice(0, MAX_TEXT);
    resume.parsedText = clipped;
    await this.resumes.save(resume);
    return clipped;
  }

  private async parse(bytes: Buffer, mime: string | null): Promise<string> {
    if (mime === 'application/pdf') {
      const data = await pdfParse(bytes);
      return data.text.trim();
    }
    if (mime === DOCX_MIME || mime === 'application/msword') {
      const result = await mammoth.extractRawText({ buffer: bytes });
      return result.value.trim();
    }
    return bytes.toString('utf8').trim();
  }
}
