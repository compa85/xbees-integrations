export interface OdooCredentials {
	url: string; // e.g. "https://mycompany.odoo.com"
	database: string; // e.g. "mycompany"
	username: string; // e.g. "admin@mycompany.com"
	apiKey: string; // Odoo API key
}

export interface OdooPartner {
	id: number;
	name: string;
	email: string | false;
	phone: string | false;
	mobile: string | false;
	company_name: string | false;
	street: string | false;
	city: string | false;
	website: string | false;
}

export const ODOO_PARTNER_FIELDS = [
	'id',
	'name',
	'email',
	'phone',
	'mobile',
	'company_name',
	'street',
	'city',
	'website',
] as const;
