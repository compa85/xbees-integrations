'use client';

import { Button, Stack, Typography } from '@mui/material';
import type { ContactQuery } from '@/core/types';

interface ContactEmptyProps {
	query: ContactQuery;
	onCreateClick: () => void;
}

export function ContactEmpty({ query, onCreateClick }: ContactEmptyProps) {
	return (
		<Stack spacing={1} alignItems="center" p={2}>
			<Typography variant="subtitle1">No contact found for</Typography>
			{query.email && <Typography variant="body2">{query.email}</Typography>}
			{query.phone && <Typography variant="body2">{query.phone}</Typography>}
			<Button variant="contained" size="small" onClick={onCreateClick}>
				Create contact
			</Button>
		</Stack>
	);
}
