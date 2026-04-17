import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { footerColumns } from '../../constants/landing';
import { getLandingColors } from '../../utils/theme-colors';
import logoWhite from '../../assets/logo_white.svg';
import logoBlack from '../../assets/logo_black.svg';

export default function Footer() {
  const isDark = true;
  const c = getLandingColors(isDark);

  return (
    <footer
      className="relative overflow-hidden px-4 sm:px-6 py-10 sm:py-14"
      style={{
        background: isDark
          ? 'linear-gradient(to bottom, rgba(14,12,30,0.72) 0%, rgba(9,8,20,0.96) 100%)'
          : 'linear-gradient(to bottom, rgba(248,246,255,0.72) 0%, rgba(240,237,255,0.96) 100%)',
      }}
    >
      {/* Watermark SVG */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none flex justify-center"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1000 180"
          preserveAspectRatio="xMidYMax meet"
          style={{ width: '100%', maxWidth: 1100, height: 'auto', display: 'block', marginBottom: -4 }}
        >
          <defs>
            <linearGradient id="wm-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity="0" />
              <stop offset="25%"  stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity={isDark ? 0.08 : 0.05} />
              <stop offset="50%"  stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity={isDark ? 0.11 : 0.07} />
              <stop offset="75%"  stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity={isDark ? 0.08 : 0.05} />
              <stop offset="100%" stopColor={isDark ? '#ffffff' : '#000000'} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wm-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#000000" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </linearGradient>
            <mask id="wm-mask">
              <rect width="100%" height="100%" fill="url(#wm-fade)" />
            </mask>
          </defs>
          <text
            x="50%"
            y="100%"
            textAnchor="middle"
            dominantBaseline="auto"
            fill="none"
            stroke="url(#wm-grad)"
            strokeWidth="0.8"
            mask="url(#wm-mask)"
            style={{
              fontSize: 178,
              fontWeight: 900,
              letterSpacing: '12px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            QALION
          </text>
        </svg>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto relative" style={{ zIndex: 1 }}>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-10 sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
        >
          <motion.div
            className="sm:col-span-2"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
          >
       <div className="flex items-center gap-2.5 mb-3">
  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
    <img 
      src={isDark ? logoWhite : logoBlack}
      alt="Qalion logo" 
      className="w-full h-full object-contain"
    />
  </div>
  <span className="font-bold text-base" style={{ color: c.textPrimary }}>
    QALION
  </span>
</div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: c.textSubtle }}>
              AI-powered test automation for modern engineering teams.
            </p>
          </motion.div>

          {footerColumns.map((col) => (
            <motion.div
              key={col.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: c.textMuted }}>
                {col.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-colors duration-200"
                      style={{ color: c.textTiny }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = c.textMuted)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = c.textTiny)}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <div className="pt-6" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-xs" style={{ color: c.textTiny }}>
            &copy; 2026 Qalion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
