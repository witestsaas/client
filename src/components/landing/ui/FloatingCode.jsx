import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../utils/theme-context.tsx';

export default function FloatingCode({ text, color, style }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      className="absolute font-mono text-xs px-3 py-1.5 rounded-lg border pointer-events-none select-none"
      style={{
        color,
        borderColor: `${color}30`,
        background: isDark ? `${color}08` : `${color}12`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: isDark ? 'none' : `0 2px 12px ${color}18`,
        zIndex: 2,
        ...style,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, isDark ? 0.7 : 0.9, isDark ? 0.7 : 0.9, 0], y: [20, 0, -10, -30] }}
      transition={{
        duration: style.duration || 6,
        repeat: Infinity,
        delay: style.delay || 0,
        ease: 'easeInOut',
      }}
    >
      {text}
    </motion.div>
  );
}
