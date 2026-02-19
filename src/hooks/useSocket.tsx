"use client";

import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

// ---------------------------------------------------------------------------
// Types matching middleware gateway events
// ---------------------------------------------------------------------------

export interface TestRunStatusEvent {
	testRunId: string;
	status: string;
	timestamp: string;
	[key: string]: unknown;
}

export interface TestRunProgressEvent {
	testRunId: string;
	progress: number;
	message?: string;
	timestamp: string;
}

export interface TestRunLogEvent {
	testRunId: string;
	log: string;
	timestamp: string;
}

export interface TestRunCompletedEvent {
	testRunId: string;
	results: unknown;
	timestamp: string;
}

export interface TestRunErrorEvent {
	testRunId: string;
	error: unknown;
	timestamp: string;
}

export interface TestRunLiveEvent {
	testRunId: string;
	type:
		// Web test agent events
		| 'action:start' | 'action:complete' | 'action:failed'
		| 'plan:init' | 'plan:update' | 'note:add'
		// CDP screencast events (Chromium only)
		| 'screencast:started' | 'screencast:frame'
		// Functional test agent events
		| 'generation:started' | 'generation:completed' | 'generation:cancelled' | 'generation:error' | 'generation:retry'
		| 'phase:analyzing' | 'phase:analyzed' | 'phase:checking' | 'phase:checked'
		| 'phase:reading-docs' | 'phase:docs-loaded' | 'phase:no-docs'
		| 'browser:analyzing' | 'browser:analyzed' | 'browser:progress'
		| 'folder:found' | 'folder:created'
		| 'test:creating' | 'test:created' | 'test:updating' | 'test:updated' | 'test:error'
		| 'docs:updated';
	data: Record<string, any>;
	testCaseId?: string;
	browser?: string;
	timestamp: string;
}

// ---------------------------------------------------------------------------
// Determine socket URL — works locally and on AWS
// ---------------------------------------------------------------------------

function getSocketUrl(): string {
	// NEXT_PUBLIC_SOCKET_URL allows explicit override (Vite: import.meta.env)
	if (import.meta.env.VITE_NEXT_PUBLIC_SOCKET_URL) {
		return import.meta.env.VITE_NEXT_PUBLIC_SOCKET_URL;
	}

	// On the server (SSR) we can't connect — return empty
	if (typeof window === "undefined") return "";

	// In production (AWS), socket.io is served by the same ALB via /socket.io/* rule
	// → connect to the same origin (the ALB URL the browser is already on)
	//
	// Locally, middleware runs on localhost:4000
	// → detect localhost and point to port 4000
	const { hostname, protocol } = window.location;

	if (hostname === "localhost" || hostname === "127.0.0.1") {
		return `${protocol}//localhost:4000`;
	}

	// Cloud: same origin — ALB routes /socket.io/* to middleware
	return "";
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SocketContextValue {
	/** The raw socket.io socket (namespace /test-execution). null when not yet connected. */
	socket: Socket | null;
	/** Whether the socket is connected */
	connected: boolean;
	/** Subscribe to a test run room. Returns an unsubscribe function. */
	subscribeTestRun: (testRunId: string) => () => void;
}

const SocketContext = createContext<SocketContextValue>({
	socket: null,
	connected: false,
	subscribeTestRun: () => () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SocketProvider({ children }: { children: ReactNode }) {
	const socketRef = useRef<Socket | null>(null);
	const [connected, setConnected] = useState(false);
	// Track subscription counts so multiple components can subscribe to the same run
	const subCounts = useRef<Map<string, number>>(new Map());

	useEffect(() => {
		const url = getSocketUrl();

		const socket = io(url ? `${url}/test-execution` : "/test-execution", {
			transports: ["polling", "websocket"],
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 10000,
			withCredentials: true,
		});

		socketRef.current = socket;

		socket.on("connect", () => {
			console.log("[Socket] Connected:", socket.id);
			setConnected(true);

			// Re-subscribe to any active subscriptions after reconnect
			subCounts.current.forEach((count, testRunId) => {
				if (count > 0) {
					socket.emit("subscribe:testRun", testRunId);
				}
			});
		});

		socket.on("disconnect", (reason) => {
			console.log("[Socket] Disconnected:", reason);
			setConnected(false);
		});

		socket.on("connect_error", (err) => {
			console.warn("[Socket] Connection error:", err.message);
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, []);

	const subscribeTestRun = useCallback((testRunId: string) => {
		const socket = socketRef.current;
		const current = subCounts.current.get(testRunId) ?? 0;

		// First subscriber → join room
		if (current === 0 && socket?.connected) {
			socket.emit("subscribe:testRun", testRunId);
		}
		subCounts.current.set(testRunId, current + 1);

		// Return unsubscribe function
		return () => {
			const count = subCounts.current.get(testRunId) ?? 1;
			const next = count - 1;

			if (next <= 0) {
				subCounts.current.delete(testRunId);
				if (socket?.connected) {
					socket.emit("unsubscribe:testRun", testRunId);
				}
			} else {
				subCounts.current.set(testRunId, next);
			}
		};
	}, []);

	return (
		<SocketContext.Provider
			value={{
				socket: socketRef.current,
				connected,
				subscribeTestRun,
			}}
		>
			{children}
		</SocketContext.Provider>
	);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Access the raw socket context */
export function useSocket() {
	return useContext(SocketContext);
}

/** Request a replay of all buffered live events for a test run */
export function useRequestLiveReplay() {
	const { socket } = useSocket();
	return useCallback((testRunId: string) => {
		if (socket?.connected) {
			socket.emit('requestReplay:liveEvents', testRunId);
		}
	}, [socket]);
}

/**
 * Subscribe to real-time updates for a specific test run.
 *
 * Automatically joins/leaves the room and listens for all gateway events.
 * Provide callbacks for the events you care about.
 */
export function useTestRunSocket(
	testRunId: string | null | undefined,
	callbacks: {
		onStatusUpdate?: (event: TestRunStatusEvent) => void;
		onProgress?: (event: TestRunProgressEvent) => void;
		onLog?: (event: TestRunLogEvent) => void;
		onCompleted?: (event: TestRunCompletedEvent) => void;
		onError?: (event: TestRunErrorEvent) => void;
		onLiveEvent?: (event: TestRunLiveEvent) => void;
	}
) {
	const { socket, connected, subscribeTestRun } = useSocket();

	// Keep callbacks in a ref so listener identity stays stable
	const callbacksRef = useRef(callbacks);
	callbacksRef.current = callbacks;

	useEffect(() => {
		if (!testRunId || !socket) return;

		const unsub = subscribeTestRun(testRunId);

		const onStatus = (data: TestRunStatusEvent) => {
			if (data.testRunId === testRunId) callbacksRef.current.onStatusUpdate?.(data);
		};
		const onProgress = (data: TestRunProgressEvent) => {
			if (data.testRunId === testRunId) callbacksRef.current.onProgress?.(data);
		};
		const onLog = (data: TestRunLogEvent) => {
			if (data.testRunId === testRunId) callbacksRef.current.onLog?.(data);
		};
		const onCompleted = (data: TestRunCompletedEvent) => {
			if (data.testRunId === testRunId) callbacksRef.current.onCompleted?.(data);
		};
		const onError = (data: TestRunErrorEvent) => {
			if (data.testRunId === testRunId) callbacksRef.current.onError?.(data);
		};
		const onLiveEvent = (data: TestRunLiveEvent) => {
			if (data.testRunId === testRunId) callbacksRef.current.onLiveEvent?.(data);
		};

		socket.on("testRun:statusUpdate", onStatus);
		socket.on("testRun:progress", onProgress);
		socket.on("testRun:log", onLog);
		socket.on("testRun:completed", onCompleted);
		socket.on("testRun:error", onError);
		socket.on("testRun:liveEvent", onLiveEvent);

		return () => {
			unsub();
			socket.off("testRun:statusUpdate", onStatus);
			socket.off("testRun:progress", onProgress);
			socket.off("testRun:log", onLog);
			socket.off("testRun:completed", onCompleted);
			socket.off("testRun:error", onError);
			socket.off("testRun:liveEvent", onLiveEvent);
		};
	}, [testRunId, socket, subscribeTestRun]);
}

/**
 * Listen for ANY test run status update (not room-scoped).
 * Useful for the dashboard / runs-list to know when any run changes.
 */
export function useTestRunGlobalUpdates(
	callback: (event: TestRunStatusEvent) => void
) {
	const { socket, connected } = useSocket();
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		if (!socket) return;

		const handler = (data: TestRunStatusEvent) => {
			callbackRef.current(data);
		};

		socket.on("testRun:statusUpdate", handler);
		socket.on("testRun:completed", handler);

		return () => {
			socket.off("testRun:statusUpdate", handler);
			socket.off("testRun:completed", handler);
		};
	}, [socket, connected]);
}
