import { describe, expect, it } from 'vitest';
import type { Contact, ContactDisplayField, ContactQuery, EncryptedCredentials } from '../types';

describe('Core types', () => {
	it('should allow creating a Contact', () => {
		const contact: Contact = {
			id: '1',
			name: 'John Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			company: 'Acme Inc',
			externalUrl: 'https://crm.example.com/contact/1',
		};
		expect(contact.id).toBe('1');
		expect(contact.name).toBe('John Doe');
	});

	it('should allow creating a ContactQuery', () => {
		const query: ContactQuery = { email: 'john@example.com', phone: '+1234567890' };
		expect(query.email).toBe('john@example.com');
	});

	it('should allow partial Contact for creation', () => {
		const data: Partial<Contact> = { name: 'Jane', email: 'jane@example.com' };
		expect(data.name).toBe('Jane');
		expect(data.id).toBeUndefined();
	});
});
