import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../utils/theme-context.tsx';

export default function Aurora() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{ background: isDark ? '#020205' : '#f8f8fc' }} />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: '70vw', height: '50vh', filter: 'blur(80px)',
          background: isDark
            ? 'radial-gradient(ellipse, rgba(255,140,30,0.22) 0%, rgba(255,90,0,0.06) 50%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(255,183,51,0.18) 0%, rgba(255,140,30,0.06) 50%, transparent 70%)',
          top: '-15%', left: '-15%',
        }}
        animate={{ x: [0, 60, -30, 0], y: [0, 40, 80, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: '55vw', height: '60vh', filter: 'blur(100px)',
          background: isDark
            ? 'radial-gradient(ellipse, rgba(59,100,246,0.18) 0%, rgba(30,60,200,0.05) 50%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(99,130,246,0.14) 0%, rgba(60,90,220,0.04) 50%, transparent 70%)',
          top: '10%', right: '-20%',
        }}
        animate={{ x: [0, -80, 20, 0], y: [0, 60, -40, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: '50vw', height: '45vh', filter: 'blur(120px)',
          background: isDark
            ? 'radial-gradient(ellipse, rgba(130,60,220,0.14) 0%, rgba(80,20,180,0.04) 50%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(160,100,230,0.10) 0%, rgba(120,60,200,0.03) 50%, transparent 70%)',
          bottom: '-10%', left: '25%',
        }}
        animate={{ x: [0, 40, -60, 0], y: [0, -50, 30, 0], scale: [1, 1.2, 0.85, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: '35vw', height: '35vh', filter: 'blur(90px)',
          background: isDark
            ? 'radial-gradient(ellipse, rgba(0,200,200,0.09) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(0,180,180,0.07) 0%, transparent 70%)',
          top: '40%', left: '40%',
        }}
        animate={{ x: [0, -40, 70, 0], y: [0, 30, -50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
      />

      {isDark && (
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }} />
      )}

      <div className="absolute inset-0" style={{
        background: isDark
          ? 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(2,2,5,0.8) 100%)'
          : 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(248,248,252,0.7) 100%)',
      }} />
    </div>
  );
}
