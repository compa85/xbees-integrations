'use client';

import { useCallback } from 'react';
import type { Contact, ContactQuery, EncryptedCredentials } from '@/core/types';

export function useContactSearch(integrationId: string, credentials: EncryptedCredentials | null) {
	const credHeader = credentials ? JSON.stringify(credentials) : '';

	const searchContacts = useCallback(
		async (query: string): Promise<Contact[]> => {
			if (!credentials) return [];

			const url = new URL(`/api/proxy/${integrationId}/search`, window.location.origin);
			url.searchParams.set('query', query);

			const response = await fetch(url.toString(), {
				headers: { 'x-credentials': credHeader },
			});

			if (!response.ok) return [];

			const result = await response.json();
			return result.data ?? [];
		},
		[integrationId, credHeader],
	);

	const lookupContact = useCallback(
		async (query: ContactQuery): Promise<Contact | null> => {
			if (!credentials) return null;

			const url = new URL(`/api/proxy/${integrationId}/contact`, window.location.origin);
			if (query.email) url.searchParams.set('email', query.email);
			if (query.phone) url.searchParams.set('phone', query.phone);

			const response = await fetch(url.toString(), {
				headers: { 'x-credentials': credHeader },
			});

			if (!response.ok) return null;

			const result = await response.json();
			return result.data ?? null;
		},
		[integrationId, credHeader],
	);

	const createContact = useCallback(
		async (data: Partial<Contact>): Promise<Contact | null> => {
			if (!credentials) return null;

			const response = await fetch(`/api/proxy/${integrationId}/contact`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-credentials': credHeader,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) return null;

			const result = await response.json();
			return result.data ?? null;
		},
		[integrationId, credHeader],
	);

	return { searchContacts, lookupContact, createContact };
}
