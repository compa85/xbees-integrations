import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { EncryptedCredentials } from './types';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(plaintext: string, hexKey: string): EncryptedCredentials {
	const key = Buffer.from(hexKey, 'hex');
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(plaintext, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');

	return {
		encrypted: `${encrypted}:${authTag}`,
		iv: iv.toString('hex'),
	};
}

export function decrypt(data: EncryptedCredentials, hexKey: string): string {
	const key = Buffer.from(hexKey, 'hex');
	const iv = Buffer.from(data.iv, 'hex');
	const [encryptedText, authTag] = data.encrypted.split(':');

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(Buffer.from(authTag, 'hex'));

	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

export function getEncryptionKey(): string {
	const key = process.env.ENCRYPTION_KEY;
	if (!key || key.length !== 64) {
		throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
	}
	return key;
}
