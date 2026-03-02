import React from 'react';
import { motion } from 'framer-motion';
import Section from './ui/Section';
import Counter from './ui/Counter';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { stats } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Stats() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <Section
      className="py-20 px-6 relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(255,183,51,0.04) 0%, rgba(8,8,12,1) 40%, rgba(100,130,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255,183,51,0.06) 0%, #f4f5fb 40%, rgba(100,130,255,0.06) 100%)',
        borderTop: `1px solid ${c.borderTop}`,
        borderBottom: `1px solid ${c.borderTop}`,
      }}>
      <div className="max-w-4xl mx-auto">
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="flex flex-col items-center">
              <span className="text-5xl font-bold mb-2" style={{ color: s.color }}>
                <Counter to={s.value} suffix={s.suffix} duration={2.5} />
              </span>
              <span className="text-sm" style={{ color: c.textSubtle }}>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
