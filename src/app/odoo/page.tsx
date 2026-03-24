'use client';

import { IntegrationShell } from '@/components/IntegrationShell';
import { OdooLoginForm } from '@/integrations/odoo/OdooLoginForm';
import { odooAdapter } from '@/integrations/odoo/odoo-adapter';

export default function OdooPage() {
	return <IntegrationShell adapter={odooAdapter} LoginForm={OdooLoginForm} />;
}
