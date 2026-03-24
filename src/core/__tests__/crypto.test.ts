import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../crypto';

describe('crypto', () => {
	const testKey = 'a'.repeat(64); // 32-byte hex key

	it('should encrypt and decrypt a string', () => {
		const plaintext = JSON.stringify({ url: 'https://odoo.example.com', apiKey: 'secret123' });
		const encrypted = encrypt(plaintext, testKey);

		expect(encrypted.encrypted).toBeDefined();
		expect(encrypted.iv).toBeDefined();
		expect(encrypted.encrypted).not.toBe(plaintext);

		const decrypted = decrypt(encrypted, testKey);
		expect(decrypted).toBe(plaintext);
	});

	it('should produce different ciphertexts for same plaintext', () => {
		const plaintext = 'test data';
		const enc1 = encrypt(plaintext, testKey);
		const enc2 = encrypt(plaintext, testKey);
		expect(enc1.encrypted).not.toBe(enc2.encrypted);
	});

	it('should fail decryption with wrong key', () => {
		const plaintext = 'secret';
		const encrypted = encrypt(plaintext, testKey);
		const wrongKey = 'b'.repeat(64);

		expect(() => decrypt(encrypted, wrongKey)).toThrow();
	});
});
