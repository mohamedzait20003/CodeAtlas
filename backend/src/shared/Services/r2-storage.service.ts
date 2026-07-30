import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly presignExpiry: number;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('r2.accountId') ?? '';
    this.bucket = config.get<string>('r2.bucket') ?? '';
    this.presignExpiry = config.get<number>('r2.presignExpiry') ?? 900;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.get<string>('r2.accessKeyId') ?? '',
        secretAccessKey: config.get<string>('r2.secretAccessKey') ?? '',
      },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** Raw object bytes — used by the generation worker to read a résumé server-side. */
  async getBytes(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  /**
   * A short-lived presigned GET URL. The response overrides make the browser
   * save a proper file (original name + content type) rather than render it.
   */
  presignDownload(
    key: string,
    fileName: string | null,
    contentType: string | null,
  ): Promise<string> {
    const safeName = fileName?.replace(/["\r\n]/g, '');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentType: contentType ?? undefined,
      ResponseContentDisposition: safeName
        ? `attachment; filename="${safeName}"`
        : undefined,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.presignExpiry,
    });
  }
}
