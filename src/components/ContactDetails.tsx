'use client';

import { Divider, Stack } from '@mui/material';
import type { Contact, ContactDisplayField } from '@/core/types';
import { ContactProperty } from './ContactProperty';
import { ExternalLinkButton } from './ExternalLinkButton';

interface ContactDetailsProps {
	contact: Contact;
	fields: ContactDisplayField[];
	integrationName: string;
}

export function ContactDetails({ contact, fields, integrationName }: ContactDetailsProps) {
	return (
		<Stack spacing={0}>
			{fields.map((field) => (
				<ContactProperty key={field.label} label={field.label} value={field.value} variant={field.variant} />
			))}
			<Divider sx={{ my: 1 }} />
			{contact.externalUrl && <ExternalLinkButton url={contact.externalUrl} label={`Open in ${integrationName}`} />}
		</Stack>
	);
}
