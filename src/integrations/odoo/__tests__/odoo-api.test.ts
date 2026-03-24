import { describe, expect, it } from 'vitest';
import { mapOdooPartnerToContact } from '../odoo-api';
import type { OdooPartner } from '../odoo-types';

describe('odoo-api', () => {
	describe('mapOdooPartnerToContact', () => {
		it('should map an Odoo partner to a Contact', () => {
			const partner: OdooPartner = {
				id: 42,
				name: 'John Doe',
				email: 'john@example.com',
				phone: '+1234567890',
				mobile: '+0987654321',
				company_name: 'Acme Inc',
				street: '123 Main St',
				city: 'Springfield',
				website: 'https://acme.com',
			};
			const baseUrl = 'https://mycompany.odoo.com';

			const contact = mapOdooPartnerToContact(partner, baseUrl);

			expect(contact.id).toBe('42');
			expect(contact.name).toBe('John Doe');
			expect(contact.email).toBe('john@example.com');
			expect(contact.phone).toBe('+1234567890');
			expect(contact.company).toBe('Acme Inc');
			expect(contact.externalUrl).toBe('https://mycompany.odoo.com/web#id=42&model=res.partner&view_type=form');
		});

		it('should handle false values from Odoo', () => {
			const partner: OdooPartner = {
				id: 1,
				name: 'Jane',
				email: false,
				phone: false,
				mobile: '+111',
				company_name: false,
				street: false,
				city: false,
				website: false,
			};

			const contact = mapOdooPartnerToContact(partner, 'https://odoo.test');

			expect(contact.email).toBeUndefined();
			expect(contact.phone).toBe('+111');
			expect(contact.company).toBeUndefined();
		});
	});
});
