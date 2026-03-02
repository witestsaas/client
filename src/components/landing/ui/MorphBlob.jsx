import React from 'react';
import { motion } from 'framer-motion';

export default function MorphBlob({ style }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ zIndex: 1, ...style }}
      animate={{
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '50% 50% 40% 60% / 40% 50% 60% 50%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
