import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { testimonials } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Testimonials() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <Section className="py-28 px-6 relative" style={{ background: c.sectionBg1 }}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-64 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,183,51,0.07) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-[#ffb733] font-bold text-xs uppercase tracking-[0.25em] mb-3">Testimonials</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold dark:text-white text-gray-900">Loved by engineering teams</motion.h2>
        </div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <motion.div key={t.author} variants={fadeUp}
              whileHover={{ y: -6 }}
              className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, boxShadow: c.cardShadow }}>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#ffb733] text-[#ffb733]" />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: c.textMuted }}>"{t.quote}"</p>
              <div>
                <p className="font-semibold text-sm dark:text-white text-gray-900">{t.author}</p>
                <p className="text-xs" style={{ color: c.textSubtle }}>{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
