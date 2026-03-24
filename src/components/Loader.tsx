'use client';

import { Box, CircularProgress } from '@mui/material';

export function Loader() {
	return (
		<Box display="flex" justifyContent="center" alignItems="center" p={4}>
			<CircularProgress size={24} />
		</Box>
	);
}
