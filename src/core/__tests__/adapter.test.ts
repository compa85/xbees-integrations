import { describe, expect, it } from 'vitest';
import type { IntegrationAdapter } from '../adapter';
import type { Contact, ContactDisplayField } from '../types';

describe('IntegrationAdapter interface', () => {
	it('should allow implementing a mock adapter', () => {
		const mockAdapter: IntegrationAdapter = {
			id: 'test',
			name: 'Test CRM',
			loginFields: [
				{ name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter key', required: true },
			],
			getContactUrl: (contact: Contact) => `https://test.com/contact/${contact.id}`,
			mapContactFields: (contact: Contact): ContactDisplayField[] => [
				{ label: 'Name', value: contact.name, variant: 'text' },
			],
		};

		expect(mockAdapter.id).toBe('test');
		expect(mockAdapter.loginFields).toHaveLength(1);

		const contact: Contact = { id: '1', name: 'John' };
		expect(mockAdapter.getContactUrl(contact)).toBe('https://test.com/contact/1');
		expect(mockAdapter.mapContactFields(contact)).toEqual([{ label: 'Name', value: 'John', variant: 'text' }]);
	});
});
