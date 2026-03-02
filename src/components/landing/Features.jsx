import React from 'react';
import { motion } from 'framer-motion';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { features } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Features() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <Section
      id="features"
      className="py-28 px-6 relative"
      style={{ background: isDark ? 'linear-gradient(180deg, #020205 0%, #05050a 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f4f5fb 100%)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,183,51,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#ffb733] font-bold text-xs uppercase tracking-[0.25em] mb-3">Features</motion.p>
          <motion.h2 variants={fadeUp}
            className="text-4xl md:text-5xl font-bold leading-tight dark:text-white text-gray-900">
            Everything you need to ship<br />with zero regression risk
          </motion.h2>
        </div>

        <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp}
                whileHover={{ y: -8, scale: 1.01 }}
                className="group relative rounded-2xl p-6 overflow-hidden cursor-default transition-all duration-300"
                style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, boxShadow: c.cardShadow }}>
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 0% 0%, ${f.accent}15 0%, transparent 50%)` }} />
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
                  style={{ boxShadow: `0 0 0 1px ${f.accent}25, 0 20px 60px ${f.accent}10` }}
                  transition={{ duration: 0.3 }} />
                <div className="relative z-10">
                  <motion.div whileHover={{ scale: 1.15, rotate: 5 }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}25` }}>
                    <Icon className="w-5 h-5" style={{ color: f.accent }} />
                  </motion.div>
                  <h3 className="font-semibold text-base mb-2 dark:text-white text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}
