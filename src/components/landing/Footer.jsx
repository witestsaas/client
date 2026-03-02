import React from 'react';
import { Zap } from 'lucide-react';
import { footerColumns } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <footer
      className="px-6 py-12"
      style={{ background: isDark ? '#010103' : '#eeeef6', borderTop: `1px solid ${c.borderTop}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#ffb733] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold dark:text-white text-gray-900">Qalion</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: c.textSubtle }}>
              AI-powered test automation for modern engineering teams.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: c.textMuted }}>{col.title}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#"
                      className="text-sm transition-colors dark:hover:text-white/70 hover:text-gray-700"
                      style={{ color: c.textTiny }}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${c.borderTop}` }}>
          <p className="text-xs" style={{ color: c.textTiny }}>© 2026 WIRKY GROUP. </p>
          <p className="text-xs font-mono" style={{ color: c.textTiny }}>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
