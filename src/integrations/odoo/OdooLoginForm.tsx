'use client';

import { useViewPortEffect } from '@wildix/xbees-connect-react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { odooAdapter } from './odoo-adapter';

interface OdooLoginFormProps {
	onSuccess: (encrypted: { encrypted: string; iv: string }, raw: Record<string, string>) => void;
}

export function OdooLoginForm({ onSuccess }: OdooLoginFormProps) {
	useViewPortEffect();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		const formData = new FormData(e.currentTarget);
		const raw: Record<string, string> = {};
		for (const field of odooAdapter.loginFields) {
			raw[field.name] = (formData.get(field.name) as string) || '';
		}

		try {
			const response = await fetch('/api/proxy/odoo/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(raw),
			});

			const result = await response.json();

			if (!response.ok) {
				setError(result.error || 'Authentication failed');
				return;
			}

			onSuccess(result.encrypted, raw);
		} catch {
			setError('Connection failed. Please check the Odoo URL.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Stack spacing={2} p={2} alignItems="center">
			<Typography variant="h6" align="center">
				Connect to Odoo
			</Typography>
			<Typography variant="body2" align="center" color="text.secondary">
				Enter your Odoo credentials to get started
			</Typography>

			{error && (
				<Alert severity="error" sx={{ width: '100%' }}>
					{error}
				</Alert>
			)}

			<form onSubmit={handleSubmit} style={{ width: '100%' }}>
				<Stack spacing={1.5}>
					{odooAdapter.loginFields.map((field) => (
						<TextField
							key={field.name}
							required={field.required}
							fullWidth
							size="small"
							name={field.name}
							label={field.label}
							type={field.type}
							placeholder={field.placeholder}
						/>
					))}
					<Button type="submit" variant="contained" size="small" disabled={isLoading}>
						{isLoading ? 'Connecting...' : 'Connect'}
					</Button>
				</Stack>
			</form>
		</Stack>
	);
}
