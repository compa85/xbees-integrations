export interface Contact {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	company?: string;
	externalUrl?: string;
	[key: string]: string | undefined;
}

export interface ContactQuery {
	email?: string;
	phone?: string;
}

export interface ContactDisplayField {
	label: string;
	value: string;
	variant?: 'text' | 'email' | 'phone' | 'link';
}

export interface EncryptedCredentials {
	encrypted: string;
	iv: string;
}

export interface LoginField {
	name: string;
	label: string;
	type: 'text' | 'password' | 'url';
	placeholder: string;
	required: boolean;
}
