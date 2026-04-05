/**
 * Returns theme-aware color tokens for the landing page.
 * isDark = theme === 'dark'  (from useTheme())
 */
export function getLandingColors(isDark) {
  return {
    // ── Page backgrounds ──────────────────────────────────────────────────
    heroBg:      isDark ? 'transparent'                      : '#f8f8fc',
    sectionBg1:  isDark ? 'transparent'                      : '#ffffff',
    sectionBg2:  isDark ? 'rgba(255,255,255,0.02)'           : '#f4f5fb',
    sectionBg3:  isDark ? 'rgba(255,255,255,0.03)'           : '#f0f1f8',
    stripBg:     isDark ? 'rgba(19,17,42,0.75)'              : '#eeeef6',

    // ── Cards ─────────────────────────────────────────────────────────────
    cardBg:      isDark ? 'rgba(255,255,255,0.03)'  : '#ffffff',
    cardBorder:  isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.07)',
    cardShadow:  isDark ? 'none'                    : '0 2px 20px rgba(0,0,0,0.06)',

    // ── Text ──────────────────────────────────────────────────────────────
    textPrimary: isDark ? '#ffffff'                 : '#0f0f1a',
    textMuted:   isDark ? 'rgba(255,255,255,0.45)'  : 'rgba(0,0,0,0.52)',
    textSubtle:  isDark ? 'rgba(255,255,255,0.25)'  : 'rgba(0,0,0,0.32)',
    textTiny:    isDark ? 'rgba(255,255,255,0.18)'  : 'rgba(0,0,0,0.35)',

    // ── Borders ───────────────────────────────────────────────────────────
    borderSm:    isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.07)',
    borderMd:    isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.09)',
    borderTop:   isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.06)',

    // ── Navbar ────────────────────────────────────────────────────────────
    navScrollBg: isDark ? 'rgba(19,17,42,0.85)'      : 'rgba(255,255,255,0.9)',
    navScrollBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',

    // ── Misc interactive ─────────────────────────────────────────────────
    inputBg:     isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.04)',
    ghostBtn:    isDark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.04)',
    ghostBorder: isDark ? 'rgba(255,255,255,0.12)'  : 'rgba(0,0,0,0.12)',

    // ── Hero mockup dashboard ────────────────────────────────────────
    mockupBg:          isDark ? '#16132a'                  : '#f5f3ff',
    mockupBorder:      isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.09)',
    mockupShadow:      isDark
      ? '0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(255,183,51,0.06)'
      : '0 40px 120px rgba(0,0,0,0.12), 0 0 80px rgba(255,183,51,0.06)',
    mockupBarBg:       isDark ? 'rgba(8,8,12,0.8)'        : 'rgba(236,236,246,0.9)',
    mockupUrlBg:       isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.05)',
    mockupUrlBorder:   isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.08)',
    mockupUrlText:     isDark ? 'rgba(255,255,255,0.25)'  : 'rgba(0,0,0,0.30)',
    mockupStatBg:      isDark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.025)',
    mockupStatBorder:  isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.07)',
    mockupPanelBg:     isDark ? 'rgba(255,255,255,0.03)'  : 'rgba(0,0,0,0.02)',
    mockupPanelBorder: isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.06)',
    mockupProgressBg:  isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.08)',
    mockupLabel:       isDark ? 'rgba(255,255,255,0.35)'  : 'rgba(0,0,0,0.40)',
    mockupPct:         isDark ? 'rgba(255,255,255,0.30)'  : 'rgba(0,0,0,0.35)',
    mockupLiveLabel:   isDark ? 'rgba(255,255,255,0.50)'  : 'rgba(0,0,0,0.55)',
  };
}
