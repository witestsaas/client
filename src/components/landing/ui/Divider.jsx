import { motion } from 'framer-motion';

export default function Divider() {
  const isDark = true;

  const lineColor = isDark
    ? 'linear-gradient(90deg, transparent, rgba(255,183,51,0.25), rgba(100,130,255,0.18), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(100,100,200,0.15), rgba(80,100,220,0.12), transparent)';

  const orbColor = isDark
    ? 'linear-gradient(90deg, transparent, #F29F05, transparent)'
    : 'linear-gradient(90deg, transparent, rgba(80,100,220,0.5), transparent)';

  return (
    <div className="relative w-full h-px">
      <div className="absolute inset-0" style={{ background: lineColor }} />
      <motion.div
        className="absolute top-0 h-px w-32"
        style={{ background: orbColor }}
        initial={{ left: '0%' }}
        animate={{ left: ['0%', 'calc(100% - 128px)', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
