import { encrypt, getEncryptionKey } from '@/core/crypto';
import { errorResponse, successResponse } from '@/core/proxy-utils';
import { odooAuthenticate } from '@/integrations/odoo/odoo-api';
import type { OdooCredentials } from '@/integrations/odoo/odoo-types';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const credentials: OdooCredentials = await request.json();

		// Validate by attempting authentication
		await odooAuthenticate(credentials);

		// Encrypt credentials for client storage
		const key = getEncryptionKey();
		const encrypted = encrypt(JSON.stringify(credentials), key);

		return successResponse({ encrypted });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Authentication failed';
		return errorResponse(message, 401);
	}
}
