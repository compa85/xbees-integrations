import type { Contact, ContactDisplayField, LoginField } from './types';

export interface IntegrationAdapter {
	id: string;
	name: string;
	loginFields: LoginField[];
	getContactUrl(contact: Contact, credentials: Record<string, string>): string;
	mapContactFields(contact: Contact): ContactDisplayField[];
}
