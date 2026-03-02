import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { staggerContainer } from '../../../utils/motion';

export default function Section({ children, className = '', id, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      style={style}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}
