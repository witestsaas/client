import { useState, useEffect, useCallback } from "react";

export function useRateLimit() {
	return {
		attempts: 0,
		isBlocked: false,
		timeRemaining: 0,
		resetTime: null,
		remainingAttempts: 0,
		recordAttempt: () => {},
		reset: () => {},
		formatTimeRemaining: '',
		canAttempt: true,
	};
}

/**
 * Hook for handling API rate limit responses (429 errors)
 */
export function useApiRateLimit() {
	// Only handle server 429 responses
	const handleApiResponse = (response: Response) => {
		if (response.status === 429) {
			const retryAfter = response.headers.get("Retry-After");
			return {
				isRateLimited: true,
				retryAfter: retryAfter ? parseInt(retryAfter) : 60,
				message: `Too many attempts. Please try again in ${retryAfter ? parseInt(retryAfter) : 60}s`,
			};
		}
		return { isRateLimited: false };
	};
	return {
		attempts: 0,
		isBlocked: false,
		timeRemaining: 0,
		resetTime: null,
		remainingAttempts: 0,
		recordAttempt: () => {},
		reset: () => {},
		formatTimeRemaining: '',
		canAttempt: true,
		handleApiResponse,
	};
}
