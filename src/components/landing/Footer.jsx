import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { footerColumns } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <footer
      className="px-4 sm:px-6 py-10 sm:py-14"
      style={{ background: isDark ? 'rgba(19,17,42,0.88)' : 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: `1px solid ${c.borderTop}` }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-10 sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
              },
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
              <div className="w-8 h-8 rounded-lg bg-[#F29F05] flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-base" style={{ color: c.textPrimary }}>Qalion</span>
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

        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${c.borderTop}` }}
        >
          <p className="text-xs" style={{ color: c.textTiny }}>
            &copy; 2026 Qalion. All rights reserved.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
