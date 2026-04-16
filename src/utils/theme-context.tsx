"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
	theme: ResolvedTheme;
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveTheme(mode: ThemeMode): ResolvedTheme {
	if (mode === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>("system");
	const [theme, setTheme] = useState<ResolvedTheme>("light");
	const [mounted, setMounted] = useState(false);

	const applyTheme = (resolved: ResolvedTheme) => {
		const html = document.documentElement;
		if (resolved === "dark") {
			html.classList.add("dark");
		} else {
			html.classList.remove("dark");
		}
	};

	// Load mode from localStorage on mount
	useEffect(() => {
		const storedMode = localStorage.getItem("themeMode") as ThemeMode | null;
		// Migrate old "theme" key
		const legacyTheme = localStorage.getItem("theme") as "light" | "dark" | null;
		const initial: ThemeMode = storedMode || legacyTheme || "system";

		setModeState(initial);
		const resolved = resolveTheme(initial);
		setTheme(resolved);
		applyTheme(resolved);
		setMounted(true);
	}, []);

	// Listen for system preference changes when in "system" mode
	useEffect(() => {
		if (mode !== "system") return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			const resolved = resolveTheme("system");
			setTheme(resolved);
			applyTheme(resolved);
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [mode]);

	const setMode = (newMode: ThemeMode) => {
		setModeState(newMode);
		localStorage.setItem("themeMode", newMode);
		const resolved = resolveTheme(newMode);
		setTheme(resolved);
		applyTheme(resolved);
	};

	const toggleTheme = () => {
		setMode(theme === "light" ? "dark" : "light");
	};

	if (!mounted) {
		return <>{children}</>;
	}

	return (
		<ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		return {
			theme: "light" as const,
			mode: "system" as ThemeMode,
			setMode: (() => {}) as (mode: ThemeMode) => void,
			toggleTheme: () => {},
		};
	}
	return context;
}
