import { decryptCredentials, errorResponse, successResponse } from '@/core/proxy-utils';
import { searchOdooContacts } from '@/integrations/odoo/odoo-api';
import type { OdooCredentials } from '@/integrations/odoo/odoo-types';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const credentials = decryptCredentials<OdooCredentials>(request.headers.get('x-credentials'));
		const query = request.nextUrl.searchParams.get('query') || '';
		const contacts = await searchOdooContacts(credentials, query);

		return successResponse({ data: contacts });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Search failed';
		return errorResponse(message, 500);
	}
}
