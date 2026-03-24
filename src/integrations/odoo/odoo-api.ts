import type { Contact, ContactQuery } from '@/core/types';
import { ODOO_PARTNER_FIELDS } from './odoo-types';
import type { OdooCredentials, OdooPartner } from './odoo-types';

export function mapOdooPartnerToContact(partner: OdooPartner, baseUrl: string): Contact {
	return {
		id: String(partner.id),
		name: partner.name,
		email: partner.email || undefined,
		phone: partner.phone || partner.mobile || undefined,
		company: partner.company_name || undefined,
		externalUrl: `${baseUrl}/web#id=${partner.id}&model=res.partner&view_type=form`,
	};
}

async function odooJsonRpc(url: string, service: string, method: string, args: unknown[]): Promise<unknown> {
	const response = await fetch(`${url}/jsonrpc`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			method: 'call',
			params: { service, method, args },
			id: Date.now(),
		}),
	});

	const data = await response.json();

	if (data.error) {
		throw new Error(data.error.data?.message || data.error.message || 'Odoo API error');
	}

	return data.result;
}

export async function odooAuthenticate(creds: OdooCredentials): Promise<number> {
	const uid = await odooJsonRpc(creds.url, 'common', 'authenticate', [creds.database, creds.username, creds.apiKey, {}]);

	if (!uid || uid === false) {
		throw new Error('Invalid Odoo credentials');
	}

	return uid as number;
}

async function odooExecuteKw(
	creds: OdooCredentials,
	uid: number,
	model: string,
	method: string,
	args: unknown[],
	kwargs: Record<string, unknown> = {},
): Promise<unknown> {
	return odooJsonRpc(creds.url, 'object', 'execute_kw', [creds.database, uid, creds.apiKey, model, method, args, kwargs]);
}

export async function searchOdooContacts(creds: OdooCredentials, query: string): Promise<Contact[]> {
	const uid = await odooAuthenticate(creds);

	const domain = query
		? ['|', '|', '|', ['name', 'ilike', query], ['email', 'ilike', query], ['phone', 'ilike', query], ['mobile', 'ilike', query]]
		: [];

	const partners = (await odooExecuteKw(creds, uid, 'res.partner', 'search_read', [domain], {
		fields: [...ODOO_PARTNER_FIELDS],
		limit: 10,
	})) as OdooPartner[];

	return partners.map((p) => mapOdooPartnerToContact(p, creds.url));
}

export async function lookupOdooContact(creds: OdooCredentials, query: ContactQuery): Promise<Contact | null> {
	const uid = await odooAuthenticate(creds);

	const conditions: unknown[][] = [];
	if (query.email) conditions.push(['email', '=', query.email]);
	if (query.phone) {
		conditions.push(['|', ['phone', '=', query.phone], ['mobile', '=', query.phone]]);
	}

	if (conditions.length === 0) return null;

	const domain = conditions.length > 1 ? ['|', ...conditions.flat()] : conditions[0];

	const partners = (await odooExecuteKw(creds, uid, 'res.partner', 'search_read', [domain], {
		fields: [...ODOO_PARTNER_FIELDS],
		limit: 1,
	})) as OdooPartner[];

	return partners.length > 0 ? mapOdooPartnerToContact(partners[0], creds.url) : null;
}

export async function createOdooContact(creds: OdooCredentials, data: Partial<Contact>): Promise<Contact> {
	const uid = await odooAuthenticate(creds);

	const partnerData: Record<string, unknown> = {};
	if (data.name) partnerData.name = data.name;
	if (data.email) partnerData.email = data.email;
	if (data.phone) partnerData.phone = data.phone;
	if (data.company) partnerData.company_name = data.company;

	const newId = (await odooExecuteKw(creds, uid, 'res.partner', 'create', [partnerData])) as number;

	return {
		id: String(newId),
		name: data.name || '',
		email: data.email,
		phone: data.phone,
		company: data.company,
		externalUrl: `${creds.url}/web#id=${newId}&model=res.partner&view_type=form`,
	};
}
