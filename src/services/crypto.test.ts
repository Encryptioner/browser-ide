import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSecrets, decryptSecrets, _resetForTesting } from '@/services/crypto';

describe('crypto service', () => {
  beforeEach(() => {
    _resetForTesting();
  });

  const sampleSecrets: Record<string, string> = {
    anthropicKey: 'sk-ant-test-key-123',
    glmKey: 'glm-test-key-456',
    openaiKey: 'sk-openai-test-key-789',
    githubToken: 'ghp_test_token_abc',
  };

  it('encrypts and decrypts secrets round-trip', async () => {
    const encrypted = await encryptSecrets(sampleSecrets);
    const decrypted = await decryptSecrets(encrypted);

    expect(decrypted).toEqual(sampleSecrets);
  });

  it('produces output that does not contain plaintext keys', async () => {
    const encrypted = await encryptSecrets(sampleSecrets);

    // The encrypted string should not contain the raw key values
    expect(encrypted).not.toContain('sk-ant-test-key-123');
    expect(encrypted).not.toContain('glm-test-key-456');
    expect(encrypted).not.toContain('sk-openai-test-key-789');
    expect(encrypted).not.toContain('ghp_test_token_abc');
  });

  it('produces valid JSON with iv and ct fields', async () => {
    const encrypted = await encryptSecrets(sampleSecrets);
    const parsed = JSON.parse(encrypted) as { iv?: string; ct?: string };

    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('ct');
    expect(typeof parsed.iv).toBe('string');
    expect(typeof parsed.ct).toBe('string');
  });

  it('generates different ciphertext for the same input (random IV)', async () => {
    const encrypted1 = await encryptSecrets(sampleSecrets);
    const encrypted2 = await encryptSecrets(sampleSecrets);

    // IVs should differ, leading to different ciphertext
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same plaintext
    const decrypted1 = await decryptSecrets(encrypted1);
    const decrypted2 = await decryptSecrets(encrypted2);
    expect(decrypted1).toEqual(sampleSecrets);
    expect(decrypted2).toEqual(sampleSecrets);
  });

  it('handles empty secrets record', async () => {
    const encrypted = await encryptSecrets({});
    const decrypted = await decryptSecrets(encrypted);

    expect(decrypted).toEqual({});
  });

  it('handles secrets with special characters', async () => {
    const special: Record<string, string> = {
      key: 'value-with-"quotes"-and-\\backslashes-and-emoji-\u{1F600}',
    };

    const encrypted = await encryptSecrets(special);
    const decrypted = await decryptSecrets(encrypted);

    expect(decrypted).toEqual(special);
  });

  it('returns empty record when decrypting with a different key', async () => {
    const encrypted = await encryptSecrets(sampleSecrets);

    // Reset the key so a new one is generated
    _resetForTesting();

    const decrypted = await decryptSecrets(encrypted);
    expect(decrypted).toEqual({});
  });

  it('gracefully handles legacy plaintext JSON', async () => {
    const legacyPlaintext = JSON.stringify(sampleSecrets);
    const decrypted = await decryptSecrets(legacyPlaintext);

    expect(decrypted).toEqual(sampleSecrets);
  });

  describe('when Web Crypto is unavailable', () => {
    const originalCrypto = globalThis.crypto;

    beforeEach(() => {
      _resetForTesting();
      // Remove crypto to simulate HTTP context
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
      _resetForTesting();
    });

    it('falls back to plaintext JSON for encryption', async () => {
      const result = await encryptSecrets(sampleSecrets);
      expect(JSON.parse(result)).toEqual(sampleSecrets);
    });

    it('decrypts plaintext JSON normally', async () => {
      const plaintext = JSON.stringify(sampleSecrets);
      const decrypted = await decryptSecrets(plaintext);
      expect(decrypted).toEqual(sampleSecrets);
    });

    it('returns empty record when encountering encrypted payload', async () => {
      // Simulate an encrypted payload that cannot be decrypted without crypto
      const fakePayload = JSON.stringify({ iv: 'abc', ct: 'def' });
      const decrypted = await decryptSecrets(fakePayload);
      expect(decrypted).toEqual({});
    });
  });
});
