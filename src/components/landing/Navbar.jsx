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

  const pillBg = scrolled
    ? isDark ? 'rgba(8,8,14,0.85)' : 'rgba(255,255,255,0.88)'
    : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  const pillBorder = scrolled ? c.navScrollBorder : c.borderSm;

  return (
    <>
      {/* Desktop pill navbar */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-4 left-0 right-0 z-50 hidden md:flex justify-center px-4"
      >
        <motion.div
          animate={{
            boxShadow: scrolled
              ? isDark
                ? '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.07)'
              : '0 2px 12px rgba(0,0,0,0.06)',
          }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300"
          style={{
            background: pillBg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${pillBorder}`,
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 pr-4 mr-2" style={{ borderRight: `1px solid ${c.borderSm}` }}>
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-7 h-7 rounded-lg bg-[#ffb733] flex items-center justify-center"
              style={{ boxShadow: '0 0 12px rgba(255,183,51,0.35)' }}
            >
              <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </motion.div>
            <span
              className="font-bold text-sm tracking-tight"
              style={{ color: c.textPrimary }}
            >
              Qalion
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center">
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="relative px-3 py-1.5 text-sm font-medium rounded-full transition-colors group"
                style={{ color: c.textMuted }}
                onMouseEnter={e => e.currentTarget.style.color = c.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = c.textMuted}
              >
                {item}
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              </a>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-4 mx-2" style={{ background: c.borderSm }} />

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: c.textMuted }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </motion.button>

          {/* Sign in */}
          <Link
            to="/signin"
            className="px-3 py-1.5 text-sm rounded-full transition-colors"
            style={{ color: c.textMuted }}
            onMouseEnter={e => e.currentTarget.style.color = c.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = c.textMuted}
          >
            Sign in
          </Link>

          {/* CTA */}
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(255,183,51,0.45)' }}
              whileTap={{ scale: 0.96 }}
              className="text-sm font-bold bg-[#ffb733] text-black px-4 py-1.5 rounded-full"
            >
              Get started
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Mobile top bar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-5 h-14"
        style={{
          background: mobileOpen || scrolled
            ? isDark ? 'rgba(2,2,5,0.95)' : 'rgba(255,255,255,0.95)'
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
            className="fixed top-14 left-0 right-0 z-40 md:hidden px-5 py-5 flex flex-col gap-3"
            style={{
              background: isDark ? 'rgba(2,2,5,0.97)' : 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(24px)',
              borderBottom: `1px solid ${c.borderSm}`,
            }}
          >
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm"
                style={{ color: c.textMuted, borderBottom: `1px solid ${c.borderSm}` }}
              >
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/signin" className="text-sm py-2 text-center rounded-full" style={{ color: c.textMuted, border: `1px solid ${c.ghostBorder}` }}>
                Sign in
              </Link>
              <Link to="/signup" className="text-sm font-bold bg-[#ffb733] text-black py-2.5 rounded-full text-center">
                Get started free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
