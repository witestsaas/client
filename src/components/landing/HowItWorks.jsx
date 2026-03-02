import React from 'react';
import { motion } from 'framer-motion';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { steps } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function HowItWorks() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <Section id="how-it-works" className="py-28 px-6 relative overflow-hidden"
      style={{ background: c.sectionBg2 }}>
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className={isDark ? 'opacity-[0.025]' : 'opacity-[0.04]'}>
          <defs>
            <pattern id="grid2" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none"
                stroke={isDark ? 'white' : 'black'} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#ffb733] font-bold text-xs uppercase tracking-[0.25em] mb-3">How it works</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold dark:text-white text-gray-900">
            Zero to fully tested<br />in four steps
          </motion.h2>
        </div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,183,51,0.2), rgba(100,130,255,0.2), rgba(34,197,94,0.2), rgba(168,85,247,0.2), transparent)' }} />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.number} variants={fadeUp} className="flex flex-col items-center text-center group">
                <motion.div
                  whileHover={{ scale: 1.1, boxShadow: `0 0 30px ${step.color}40` }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${step.color}12 0%, ${step.color}06 100%)`,
                    border: `1px solid ${step.color}30`,
                    zIndex: 10,
                  }}>
                  <Icon className="w-7 h-7" style={{ color: step.color }} />
                </motion.div>
                <div className="text-xs font-mono mb-2" style={{ color: `${step.color}80` }}>{step.number}</div>
                <h3 className="font-semibold text-base mb-2 dark:text-white text-gray-900">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}
