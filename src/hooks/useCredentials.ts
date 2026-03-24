'use client';

import Client from '@wildix/xbees-connect';
import { useCallback, useEffect, useState } from 'react';
import type { EncryptedCredentials } from '@/core/types';

const STORAGE_KEY_PREFIX = 'credentials_';

export function useCredentials(integrationId: string) {
	const storageKey = `${STORAGE_KEY_PREFIX}${integrationId}`;
	const [credentials, setCredentials] = useState<EncryptedCredentials | null>(null);
	const [rawCredentials, setRawCredentials] = useState<Record<string, string> | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		try {
			const stored = Client.getInstance().getFromStorage<EncryptedCredentials>(storageKey);
			const raw = Client.getInstance().getFromStorage<Record<string, string>>(`${storageKey}_raw`);
			if (stored) setCredentials(stored);
			if (raw) setRawCredentials(raw);
		} catch {
			// No stored credentials
		}
		setIsLoading(false);
	}, [storageKey]);

	const saveCredentials = useCallback(
		(encrypted: EncryptedCredentials, raw: Record<string, string>) => {
			Client.getInstance().saveToStorage(storageKey, encrypted);
			// Store a non-sensitive subset for URL building (just the base URL)
			const safeRaw: Record<string, string> = {};
			if (raw.url) safeRaw.url = raw.url;
			Client.getInstance().saveToStorage(`${storageKey}_raw`, safeRaw);
			setCredentials(encrypted);
			setRawCredentials(safeRaw);
		},
		[storageKey],
	);

	const clearCredentials = useCallback(() => {
		Client.getInstance().saveToStorage(storageKey, null);
		Client.getInstance().saveToStorage(`${storageKey}_raw`, null);
		setCredentials(null);
		setRawCredentials(null);
	}, [storageKey]);

	const isAuthenticated = credentials !== null;

	return { credentials, rawCredentials, isAuthenticated, isLoading, saveCredentials, clearCredentials };
}
