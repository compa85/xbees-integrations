'use client';

import Client from '@wildix/xbees-connect';
import { CopyInfoButton } from '@wildix/xbees-connect-react';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

const PropertyRoot = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	width: '100%',
	padding: '8px 0',
	alignItems: 'center',
	' .MuiSvgIcon-root': { display: 'none' },
	'&:hover .MuiSvgIcon-root': { display: 'inherit' },
});

const PropertyTitle = styled('div')({
	minWidth: '80px',
	maxWidth: '150px',
	fontSize: '13px',
	lineHeight: '20px',
});

const PropertyValueText = styled('div')({
	fontWeight: '500',
	fontSize: 13,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	lineHeight: '20px',
});

const PropertyValueLink = styled(Link)(({ theme }) => ({
	color: theme.palette.primary.main,
	fontSize: 13,
	cursor: 'pointer',
	overflow: 'hidden',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
}));

const HoverContainer = styled('div')({
	display: 'flex',
	gap: 4,
	minWidth: 0,
	whiteSpace: 'nowrap',
});

interface ContactPropertyProps {
	label: string;
	value: string;
	variant?: 'text' | 'email' | 'phone' | 'link';
	href?: string;
}

export function ContactProperty({ label, value, variant = 'text', href }: ContactPropertyProps) {
	let valueEl: React.ReactNode;

	switch (variant) {
		case 'email':
			valueEl = (
				<PropertyValueLink href={`mailto:${value}`} underline="none" target="_blank" rel="noopener">
					{value}
				</PropertyValueLink>
			);
			break;
		case 'phone':
			valueEl = (
				<PropertyValueLink underline="none" onClick={() => Client.getInstance().startCall(value)}>
					{value}
				</PropertyValueLink>
			);
			break;
		case 'link':
			valueEl = (
				<PropertyValueLink href={href || value} underline="none" target="_blank" rel="noopener">
					{value}
				</PropertyValueLink>
			);
			break;
		default:
			valueEl = <PropertyValueText>{value}</PropertyValueText>;
	}

	return (
		<PropertyRoot>
			<PropertyTitle>{label}:</PropertyTitle>
			<HoverContainer>
				{valueEl}
				<CopyInfoButton value={value} size={20} />
			</HoverContainer>
		</PropertyRoot>
	);
}
