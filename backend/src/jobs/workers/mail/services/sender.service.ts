import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { EmailJobPayload } from '../types';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);
  private readonly driver: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<string>('mail.driver') ?? 'smtp';
    this.fromEmail = this.config.get<string>('mail.fromEmail')!;
    this.fromName = this.config.get<string>('mail.fromName')!;

    this.transporter =
      this.driver === 'smtp'
        ? nodemailer.createTransport({
            host: this.config.get<string>('mail.host'),
            port: this.config.get<number>('mail.port'),
            secure: this.config.get<boolean>('mail.secure'),
            auth: {
              user: this.config.get<string>('mail.username'),
              pass: this.config.get<string>('mail.password'),
            },
          })
        : null;
  }

  async send(payload: EmailJobPayload, html: string): Promise<void> {
    if (this.driver === 'log') {
      this.logger.log(`[log] → ${payload.to.email} | "${payload.subject}"`);
      this.logger.verbose(`[log] HTML:\n${html}`);
      return;
    }

    await this.transporter!.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: `"${payload.to.name}" <${payload.to.email}>`,
      subject: payload.subject,
      html,
    });

    this.logger.log(`Sent "${payload.subject}" → ${payload.to.email}`);
  }
}
