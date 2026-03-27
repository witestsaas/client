import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Menu, X, Sun, Moon } from 'lucide-react';
import { navLinks } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <>
      {/* Desktop navbar */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-0 left-0 right-0 z-50 hidden md:block"
      >
        <div className="mx-auto max-w-5xl mt-4 px-2">
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-300"
            style={{
              background: scrolled
                ? isDark ? 'rgba(8,8,13,0.88)' : 'rgba(255,255,255,0.92)'
                : 'transparent',
              backdropFilter: scrolled ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
              border: scrolled ? `1px solid ${c.borderSm}` : '1px solid transparent',
              boxShadow: scrolled
                ? isDark
                  ? '0 4px 30px rgba(0,0,0,0.3)'
                  : '0 4px 30px rgba(0,0,0,0.06)'
                : 'none',
            }}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg bg-[#ffb733] flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(255,183,51,0.3)' }}
              >
                <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-base tracking-tight" style={{ color: c.textPrimary }}>
                Qalion
              </span>
            </Link>

            {/* Center links */}
            <div className="flex items-center gap-1">
              {navLinks.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: c.textMuted }}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: c.textMuted }}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                to="/signin"
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200"
                style={{ color: c.textMuted }}
              >
                Sign in
              </Link>
              <Link to="/signup">
                <button className="text-sm font-semibold bg-[#ffb733] hover:bg-[#e5a22e] text-black px-5 py-2 rounded-lg transition-colors duration-200">
                  Get started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile top bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-4 sm:px-5 h-14"
        style={{
          background: mobileOpen || scrolled
            ? isDark ? 'rgba(8,8,13,0.95)' : 'rgba(255,255,255,0.95)'
            : 'transparent',
          backdropFilter: 'blur(16px)',
          borderBottom: scrolled || mobileOpen ? `1px solid ${c.borderSm}` : 'none',
          transition: 'background 0.3s, border 0.3s',
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ffb733] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm" style={{ color: c.textPrimary }}>Qalion</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center" style={{ color: c.textMuted }}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: c.textPrimary }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 right-0 z-40 md:hidden px-4 sm:px-5 py-4 flex flex-col gap-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            style={{
              background: isDark ? 'rgba(8,8,13,0.98)' : 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(24px)',
              borderBottom: `1px solid ${c.borderSm}`,
            }}
          >
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-2 text-sm rounded-lg transition-colors"
                style={{ color: c.textMuted }}
              >
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-2" style={{ borderTop: `1px solid ${c.borderSm}` }}>
              <Link to="/signin" className="text-sm py-2.5 text-center rounded-lg" style={{ color: c.textMuted, border: `1px solid ${c.ghostBorder}` }}>
                Sign in
              </Link>
              <Link to="/signup" className="text-sm font-semibold bg-[#ffb733] text-black py-2.5 rounded-lg text-center">
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
