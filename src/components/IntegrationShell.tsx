'use client';

import Client from '@wildix/xbees-connect';
import type { Contact as XBeesContact } from '@wildix/xbees-connect/dist-types/types';
import { useThemeEffect, useViewPortEffect } from '@wildix/xbees-connect-react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode, useCallback, useEffect, useState } from 'react';
import type { IntegrationAdapter } from '@/core/adapter';
import type { Contact, ContactQuery } from '@/core/types';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useCredentials } from '@/hooks/useCredentials';
import { useXBeesInit } from '@/hooks/useXBeesInit';
import { ContactCreate } from './ContactCreate';
import { ContactDetails } from './ContactDetails';
import { ContactEmpty } from './ContactEmpty';
import { Loader } from './Loader';

interface IntegrationShellProps {
	adapter: IntegrationAdapter;
	LoginForm: React.ComponentType<{
		onSuccess: (encrypted: { encrypted: string; iv: string }, raw: Record<string, string>) => void;
	}>;
}

function IntegrationContent({ adapter, LoginForm }: IntegrationShellProps) {
	const { credentials, rawCredentials, isAuthenticated, isLoading, saveCredentials } = useCredentials(adapter.id);
	const { searchContacts, lookupContact, createContact } = useContactSearch(adapter.id, credentials);
	const [uiReady, setUiReady] = useState(false);
	const [context, setContext] = useState<ContactQuery | null>(null);
	const [contact, setContact] = useState<Contact | null>(null);
	const [view, setView] = useState<'loading' | 'details' | 'empty' | 'create' | 'login'>('loading');

	useXBeesInit({
		isAuthenticated,
		onSearch: searchContacts,
		onLookup: lookupContact,
		onStartUI: () => setUiReady(true),
	});

	// Load context and find contact on auth
	const loadContact = useCallback(async () => {
		if (!isAuthenticated) {
			setView('login');
			return;
		}

		try {
			const contextMessage = await Client.getInstance().getContext();
			const query = contextMessage?.payload?.contact;

			if (!query) {
				setView('empty');
				return;
			}

			setContext(query);
			const found = await lookupContact({ email: query.email, phone: query.phone });

			if (found) {
				setContact(found);
				setView('details');
				void Client.getInstance().contactUpdated(query, found as unknown as XBeesContact);
			} else {
				setView('empty');
			}
		} catch {
			setView('empty');
		}
	}, [isAuthenticated, lookupContact]);

	// Trigger on auth change or UI ready
	useEffect(() => {
		if (uiReady || !isLoading) {
			void loadContact();
		}
	}, [uiReady, isLoading, loadContact]);

	if (isLoading) return <Loader />;

	if (!isAuthenticated || view === 'login') {
		return (
			<LoginForm
				onSuccess={(encrypted, raw) => {
					saveCredentials(encrypted, raw);
					void loadContact();
				}}
			/>
		);
	}

	if (view === 'loading') return <Loader />;

	if (view === 'create') {
		return (
			<ContactCreate
				query={context || {}}
				existingContact={contact}
				onSubmit={async (data) => {
					const created = await createContact(data);
					if (created) {
						setContact(created);
						setView('details');
					}
				}}
			/>
		);
	}

	if (view === 'details' && contact) {
		const fields = adapter.mapContactFields(contact);
		return <ContactDetails contact={contact} fields={fields} integrationName={adapter.name} />;
	}

	return <ContactEmpty query={context || {}} onCreateClick={() => setView('create')} />;
}

export function IntegrationShell({ adapter, LoginForm }: IntegrationShellProps) {
	useViewPortEffect();
	// useThemeEffect syncs the MUI theme with X-Bees (colors, typography, dark/light mode)
	const { theme } = useThemeEffect();

	return (
		<StrictMode>
			<ThemeProvider theme={theme}>
				<CssBaseline enableColorScheme />
				<IntegrationContent adapter={adapter} LoginForm={LoginForm} />
			</ThemeProvider>
		</StrictMode>
	);
}
