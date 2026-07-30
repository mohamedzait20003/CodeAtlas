import { join } from 'path';
import * as Handlebars from 'handlebars';
import { existsSync, readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class RendererService implements OnModuleInit {
  private readonly logger = new Logger(RendererService.name);
  private readonly overridePath: string;
  private readonly appUrl: string;
  private readonly bodyCache = new Map<string, HandlebarsTemplateDelegate>();
  private baseTemplate!: HandlebarsTemplateDelegate;

  constructor(private readonly config: ConfigService) {
    this.overridePath = this.config.get<string>('mail.templatesPath') ?? '';
    this.appUrl = this.config.get<string>('app.frontendUrl')!;
  }

  onModuleInit(): void {
    const basePath = join(__dirname, '../templates/BaseMail.hbs');

    if (!existsSync(basePath)) {
      throw new InternalServerErrorException(
        `BaseMail.hbs not found at '${basePath}'.`,
      );
    }

    this.baseTemplate = Handlebars.compile(readFileSync(basePath, 'utf-8'));
    this.logger.log('BaseMail.hbs loaded.');
  }

  render(viewName: string, data: Record<string, unknown>): string {
    const body = this.compileBody(viewName)(data);

    return this.baseTemplate({
      ...data,
      body,
      year: new Date().getFullYear(),
      appUrl: this.appUrl,
    });
  }

  private compileBody(viewName: string): HandlebarsTemplateDelegate {
    const cached = this.bodyCache.get(viewName);
    if (cached) return cached;

    const source = this.resolveBody(viewName);
    const compiled = Handlebars.compile(source);
    this.bodyCache.set(viewName, compiled);
    return compiled;
  }

  private resolveBody(viewName: string): string {
    // 1. External override path (deployment-time customisation)
    if (this.overridePath) {
      const fsPath = join(this.overridePath, `${viewName}.hbs`);
      if (existsSync(fsPath)) return readFileSync(fsPath, 'utf-8');
    }

    // 2. Bundled worker templates
    const bundled = join(__dirname, '../templates', `${viewName}.hbs`);
    if (existsSync(bundled)) return readFileSync(bundled, 'utf-8');

    throw new InternalServerErrorException(
      `Email template '${viewName}' not found.`,
    );
  }
}
