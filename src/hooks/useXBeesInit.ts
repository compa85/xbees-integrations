'use client';

import Client from '@wildix/xbees-connect';
import type { Contact as XBeesContact } from '@wildix/xbees-connect/dist-types/types';
import { useEffect, useRef } from 'react';
import type { Contact, ContactQuery } from '@/core/types';

interface UseXBeesInitOptions {
	isAuthenticated: boolean;
	onSearch: (query: string) => Promise<Contact[]>;
	onLookup: (query: ContactQuery) => Promise<Contact | null>;
	onStartUI: () => void;
}

export function useXBeesInit({ isAuthenticated, onSearch, onLookup, onStartUI }: UseXBeesInitOptions) {
	const initialized = useRef(false);
	// Use refs to avoid stale closures in event handlers registered once
	const isAuthRef = useRef(isAuthenticated);
	const onSearchRef = useRef(onSearch);
	const onLookupRef = useRef(onLookup);

	useEffect(() => {
		isAuthRef.current = isAuthenticated;
	}, [isAuthenticated]);
	useEffect(() => {
		onSearchRef.current = onSearch;
	}, [onSearch]);
	useEffect(() => {
		onLookupRef.current = onLookup;
	}, [onLookup]);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;

		Client.initialize(async () => {
			onStartUI();
		});

		const client = Client.getInstance();

		client.onSuggestContacts(async (query, resolve, reject) => {
			if (!isAuthRef.current) {
				return client.isNotAuthorized();
			}
			try {
				const contacts = await onSearchRef.current(query);
				resolve(contacts as unknown as XBeesContact[]);
			} catch (error) {
				reject(`${error}`);
			}
		});

		client.onLookupAndMatchContact(async (query, resolve, reject) => {
			if (!isAuthRef.current) {
				return client.isNotAuthorized();
			}
			try {
				const contact = await onLookupRef.current({
					email: query.email,
					phone: query.phone,
				});
				if (contact) {
					resolve(contact as unknown as XBeesContact);
				} else {
					reject('not found');
				}
			} catch (error) {
				reject(`${error}`);
			}
		});

		client.onLogout(() => {
			// Credentials will be cleared by the useCredentials hook
		});

		void client.ready();

		if (!isAuthRef.current) {
			void client.isNotAuthorized();
		} else {
			void client.isAuthorized();
		}
	}, []);

	// Sync auth state changes
	useEffect(() => {
		const client = Client.getInstance();
		if (isAuthenticated) {
			void client.isAuthorized();
		} else {
			void client.isNotAuthorized();
		}
	}, [isAuthenticated]);
}
