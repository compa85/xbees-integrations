import { describe, expect, it } from 'vitest';
import { errorResponse, successResponse } from '../proxy-utils';

describe('proxy-utils', () => {
	it('errorResponse should return a JSON Response with error', () => {
		const response = errorResponse('Something went wrong', 400);
		expect(response.status).toBe(400);
	});

	it('successResponse should return a JSON Response with data', () => {
		const response = successResponse({ contacts: [] });
		expect(response.status).toBe(200);
	});
});
