import { NextResponse } from 'next/server';
import { decrypt, getEncryptionKey } from './crypto';
import type { EncryptedCredentials } from './types';

export function decryptCredentials<T>(headerValue: string | null): T {
	if (!headerValue) {
		throw new Error('Missing credentials');
	}

	const parsed: EncryptedCredentials = JSON.parse(headerValue);
	const key = getEncryptionKey();
	const decrypted = decrypt(parsed, key);

	return JSON.parse(decrypted) as T;
}

export function errorResponse(message: string, status = 500): NextResponse {
	return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status = 200): NextResponse {
	return NextResponse.json(data, { status });
}
