import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={scrolled ? {
        background: c.navScrollBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${c.navScrollBorder}`,
      } : {}}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-8 h-8 rounded-lg bg-[#ffb733] flex items-center justify-center shadow-lg shadow-[#ffb733]/30">
            <Zap className="w-4 h-4 text-black" />
          </motion.div>
          <span className="font-bold text-lg tracking-tight dark:text-white text-gray-900">Qalion</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm dark:text-white/50 text-gray-500 dark:hover:text-white hover:text-gray-900 transition-colors relative group">
              {item}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#ffb733] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors dark:text-white/60 text-gray-500 dark:hover:text-white hover:text-gray-900"
            style={{ background: c.ghostBtn, border: `1px solid ${c.ghostBorder}` }}
            aria-label="Toggle theme">
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />}
          </motion.button>

          <Link to="/signin"
            className="text-sm dark:text-white/60 text-gray-500 dark:hover:text-white hover:text-gray-900 transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(255,183,51,0.4)' }}
              whileTap={{ scale: 0.96 }}
              className="text-sm font-bold bg-[#ffb733] text-black px-5 py-2 rounded-lg transition-colors hover:bg-[#ffc853]">
              Get started free
            </motion.button>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center dark:text-white/60 text-gray-500"
            style={{ background: c.ghostBtn }}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
          <button
            className="dark:text-white text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden backdrop-blur-2xl px-6 py-4 flex flex-col gap-4"
          style={{
            background: isDark ? 'rgba(2,2,5,0.97)' : 'rgba(255,255,255,0.97)',
            borderTop: `1px solid ${c.borderSm}`,
          }}>
          {navLinks.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm dark:text-white/60 text-gray-600 dark:hover:text-white hover:text-gray-900">{item}</a>
          ))}
          <hr style={{ borderColor: c.borderSm }} />
          <Link to="/signin" className="text-sm dark:text-white/60 text-gray-600">Sign in</Link>
          <Link to="/signup" className="text-sm font-bold bg-[#ffb733] text-black px-5 py-2.5 rounded-lg text-center">
            Get started free
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
