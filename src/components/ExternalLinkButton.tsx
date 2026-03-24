'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Button } from '@mui/material';

interface ExternalLinkButtonProps {
	url: string;
	label: string;
}

export function ExternalLinkButton({ url, label }: ExternalLinkButtonProps) {
	return (
		<Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} href={url} target="_blank" rel="noopener" sx={{ mt: 1 }}>
			{label}
		</Button>
	);
}
