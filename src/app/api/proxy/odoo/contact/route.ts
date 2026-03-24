import { decryptCredentials, errorResponse, successResponse } from '@/core/proxy-utils';
import { createOdooContact, lookupOdooContact } from '@/integrations/odoo/odoo-api';
import type { OdooCredentials } from '@/integrations/odoo/odoo-types';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const credentials = decryptCredentials<OdooCredentials>(request.headers.get('x-credentials'));
		const email = request.nextUrl.searchParams.get('email') || undefined;
		const phone = request.nextUrl.searchParams.get('phone') || undefined;
		const contact = await lookupOdooContact(credentials, { email, phone });

		return successResponse({ data: contact });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Lookup failed';
		return errorResponse(message, 500);
	}
}

export async function POST(request: NextRequest) {
	try {
		const credentials = decryptCredentials<OdooCredentials>(request.headers.get('x-credentials'));
		const contactData = await request.json();
		const contact = await createOdooContact(credentials, contactData);

		return successResponse({ data: contact }, 201);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Create failed';
		return errorResponse(message, 500);
	}
}
