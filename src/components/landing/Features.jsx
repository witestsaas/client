import { motion } from 'framer-motion';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { features } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Features() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <Section
      id="features"
      className="py-16 sm:py-24 md:py-36 px-4 sm:px-6 relative"
      style={{
        background: isDark ? 'rgba(14,12,30,0.45)' : 'rgba(250,250,250,0.45)',
      }}
    >
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p 
            variants={fadeUp} 
            className="text-[#F29F05] font-semibold text-xs uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Features
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: c.textPrimary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Everything you need to ship
            <br />
            with zero regression risk
          </motion.h2>
          <motion.p 
            variants={fadeUp} 
            className="text-base max-w-xl mx-auto" 
            style={{ color: c.textMuted }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            From autonomous test generation to deep analytics, Qalion handles the entire QA lifecycle.
          </motion.p>
        </div>

        <motion.div 
          variants={staggerContainer} 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((f) => {
            const Icon = f.icon;
            const accent = isDark ? '#ffffff' : '#0D0D0D';
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: `0 20px 40px rgba(94, 0, 255, 0.2)` }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl p-4 sm:p-6 transition-all duration-300 cursor-pointer"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.cardBorder}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: `${accent}10`,
                    border: `1px solid ${accent}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: c.textPrimary }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.textMuted }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}
