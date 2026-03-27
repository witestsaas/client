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
      className="py-16 sm:py-24 md:py-36 px-4 sm:px-6"
      style={{ background: c.sectionBg1 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-[#ffb733] font-semibold text-xs uppercase tracking-[0.2em] mb-4">
            Features
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: c.textPrimary }}
          >
            Everything you need to ship
            <br />
            with zero regression risk
          </motion.h2>
          <motion.p variants={fadeUp} className="text-base max-w-xl mx-auto" style={{ color: c.textMuted }}>
            From autonomous test generation to deep analytics, Qalion handles the entire QA lifecycle.
          </motion.p>
        </div>

        <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-4 sm:p-6 transition-all duration-300"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.cardBorder}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: `${f.accent}10`,
                    border: `1px solid ${f.accent}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: f.accent }} />
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
