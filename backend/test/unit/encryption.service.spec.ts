import { ConfigService } from '@nestjs/config';

import { EncryptionService } from '@/shared/Services/encryption.service';

// 64 hex chars = 32 bytes (AES-256).
const KEY = 'a'.repeat(64);

function makeService(key: string = KEY): EncryptionService {
  const config = {
    get: (k: string) => (k === 'auth.tokenEncryptionKey' ? key : undefined),
  } as unknown as ConfigService;
  return new EncryptionService(config);
}

describe('EncryptionService', () => {
  const service = makeService();

  it('round-trips plaintext through encrypt/decrypt', () => {
    const secret = 'gho_someGitHubOAuthToken1234567890';
    expect(service.decrypt(service.encrypt(secret))).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const a = service.encrypt('same');
    const b = service.encrypt('same');
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe(service.decrypt(b));
  });

  it('rejects a tampered ciphertext (GCM auth tag)', () => {
    const [iv, tag, data] = service.encrypt('secret').split(':');
    const flipped = data[0] === 'A' ? 'B' : 'A';
    const tampered = `${iv}:${tag}:${flipped}${data.slice(1)}`;
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('rejects a malformed payload', () => {
    expect(() => service.decrypt('not-a-valid-payload')).toThrow(/malformed/i);
  });

  it('fails fast when the key is not 64 hex chars', () => {
    expect(() => makeService('tooshort')).toThrow(/64 hex/i);
    expect(() => makeService('')).toThrow(/64 hex/i);
  });

  it('safeEquals compares in constant time by value', () => {
    expect(service.safeEquals('abc', 'abc')).toBe(true);
    expect(service.safeEquals('abc', 'abd')).toBe(false);
    expect(service.safeEquals('abc', 'abcd')).toBe(false);
  });
});
