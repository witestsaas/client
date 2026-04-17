import React from 'react';
import { motion } from 'framer-motion';
import Section from './ui/Section';
import { fadeUp, fadeIn } from '../../utils/motion';
import { logos } from '../../constants/landing';
import { getLandingColors } from '../../utils/theme-colors';

export default function LogosStrip() {
  const isDark = true;
  const c = getLandingColors(isDark);

  return (
    <Section
      className="py-14 overflow-hidden"
      style={{
        background: c.stripBg,
        borderTop: `1px solid ${c.borderTop}`,
        borderBottom: `1px solid ${c.borderTop}`,
      }}>
      <motion.p variants={fadeIn}
        className="text-center text-xs mb-8 uppercase tracking-[0.3em] font-medium"
        style={{ color: c.textSubtle }}>
        Powered by the best in class
      </motion.p>
      <div className="flex gap-10 items-center justify-center flex-wrap px-8">
        {logos.map((logo) => (
          <motion.span key={logo} variants={fadeUp}
            whileHover={{ scale: 1.05 }}
            className="font-semibold text-sm cursor-default whitespace-nowrap transition-all duration-300"
            style={{ color: c.textTiny }}>
            {logo}
          </motion.span>
        ))}
      </div>
    </Section>
  );
}
