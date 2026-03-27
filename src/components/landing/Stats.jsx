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
      className="py-14 sm:py-20 px-4 sm:px-6"
      style={{
        borderTop: `1px solid ${c.borderTop}`,
        borderBottom: `1px solid ${c.borderTop}`,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2" style={{ color: s.color }}>
                <Counter to={s.value} suffix={s.suffix} duration={2.5} />
              </span>
              <span className="text-sm" style={{ color: c.textMuted }}>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
