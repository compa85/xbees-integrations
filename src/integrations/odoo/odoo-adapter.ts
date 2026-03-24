import type { IntegrationAdapter } from '@/core/adapter';
import type { Contact, ContactDisplayField } from '@/core/types';

export const odooAdapter: IntegrationAdapter = {
	id: 'odoo',
	name: 'Odoo',

	loginFields: [
		{ name: 'url', label: 'Odoo URL', type: 'url', placeholder: 'https://mycompany.odoo.com', required: true },
		{ name: 'database', label: 'Database', type: 'text', placeholder: 'mycompany', required: true },
		{ name: 'username', label: 'Username / Email', type: 'text', placeholder: 'admin@mycompany.com', required: true },
		{ name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Odoo API key', required: true },
	],

	getContactUrl(contact: Contact, credentials: Record<string, string>): string {
		const baseUrl = credentials.url || '';
		return `${baseUrl}/web#id=${contact.id}&model=res.partner&view_type=form`;
	},

	mapContactFields(contact: Contact): ContactDisplayField[] {
		const fields: ContactDisplayField[] = [{ label: 'Name', value: contact.name, variant: 'text' }];

		if (contact.email) {
			fields.push({ label: 'Email', value: contact.email, variant: 'email' });
		}
		if (contact.phone) {
			fields.push({ label: 'Phone', value: contact.phone, variant: 'phone' });
		}
		if (contact.company) {
			fields.push({ label: 'Company', value: contact.company, variant: 'text' });
		}

		return fields;
	},
};
