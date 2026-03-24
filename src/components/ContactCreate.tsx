'use client';

import { useViewPortEffect } from '@wildix/xbees-connect-react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { Contact, ContactQuery } from '@/core/types';

interface ContactCreateProps {
	query: ContactQuery;
	existingContact?: Contact | null;
	onSubmit: (data: Partial<Contact>) => Promise<void>;
}

export function ContactCreate({ query, existingContact, onSubmit }: ContactCreateProps) {
	useViewPortEffect();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		const formData = new FormData(e.currentTarget);
		await onSubmit({
			name: formData.get('name') as string,
			email: formData.get('email') as string,
			phone: formData.get('phone') as string,
			company: formData.get('company') as string,
		});

		setIsSubmitting(false);
	};

	return (
		<Stack spacing={1} p={1}>
			<Typography variant="subtitle1">{existingContact ? 'Edit contact' : 'Create new contact'}</Typography>
			<form onSubmit={handleSubmit}>
				<Stack spacing={1.5}>
					<TextField required fullWidth size="small" name="name" label="Name" defaultValue={existingContact?.name} />
					<TextField
						fullWidth
						size="small"
						name="email"
						label="Email"
						defaultValue={existingContact?.email ?? query.email}
					/>
					<TextField
						fullWidth
						size="small"
						name="phone"
						label="Phone"
						defaultValue={existingContact?.phone ?? query.phone}
					/>
					<TextField
						fullWidth
						size="small"
						name="company"
						label="Company"
						defaultValue={existingContact?.company}
					/>
					<Button type="submit" variant="contained" size="small" disabled={isSubmitting}>
						{existingContact ? 'Update' : 'Create'}
					</Button>
				</Stack>
			</form>
		</Stack>
	);
}
