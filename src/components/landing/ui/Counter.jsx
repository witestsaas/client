import React, { useRef, useEffect, useState } from 'react';
import { useInView, animate } from 'framer-motion';

export default function Counter({ from = 0, to, suffix = '', duration = 2.2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(from, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return ctrl.stop;
  }, [inView, from, to, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}
