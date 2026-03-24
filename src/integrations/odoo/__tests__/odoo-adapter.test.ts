import { describe, expect, it } from 'vitest';
import { odooAdapter } from '../odoo-adapter';

describe('odooAdapter', () => {
	it('should have correct id and name', () => {
		expect(odooAdapter.id).toBe('odoo');
		expect(odooAdapter.name).toBe('Odoo');
	});

	it('should define login fields for url, database, username, apiKey', () => {
		const fieldNames = odooAdapter.loginFields.map((f) => f.name);
		expect(fieldNames).toContain('url');
		expect(fieldNames).toContain('database');
		expect(fieldNames).toContain('username');
		expect(fieldNames).toContain('apiKey');
	});

	it('should generate correct external URL', () => {
		const url = odooAdapter.getContactUrl({ id: '42', name: 'Test' }, { url: 'https://mycompany.odoo.com' });
		expect(url).toBe('https://mycompany.odoo.com/web#id=42&model=res.partner&view_type=form');
	});

	it('should map contact fields for display', () => {
		const fields = odooAdapter.mapContactFields({
			id: '1',
			name: 'John Doe',
			email: 'john@example.com',
			phone: '+123',
			company: 'Acme',
		});

		expect(fields.find((f) => f.label === 'Name')?.value).toBe('John Doe');
		expect(fields.find((f) => f.label === 'Email')?.variant).toBe('email');
		expect(fields.find((f) => f.label === 'Phone')?.variant).toBe('phone');
		expect(fields.find((f) => f.label === 'Company')?.variant).toBe('text');
	});
});
