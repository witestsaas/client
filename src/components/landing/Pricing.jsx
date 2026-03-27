import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { plans } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Pricing() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <Section
      id="pricing"
      className="py-16 sm:py-24 md:py-36 px-4 sm:px-6"
      style={{ background: c.sectionBg2 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-[#ffb733] font-semibold text-xs uppercase tracking-[0.2em] mb-4">
            Pricing
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3" style={{ color: c.textPrimary }}>
            Simple, transparent pricing
          </motion.h2>
          <motion.p variants={fadeUp} className="text-base" style={{ color: c.textMuted }}>
            No hidden fees. Cancel anytime.
          </motion.p>
        </div>

        <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 items-start">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 transition-all duration-300"
              style={
                plan.highlight
                  ? {
                      background: 'linear-gradient(135deg, #ffb733 0%, #ff8c00 100%)',
                      border: '1px solid rgba(255,183,51,0.5)',
                      boxShadow: '0 20px 60px rgba(255,183,51,0.2)',
                    }
                  : {
                      background: c.cardBg,
                      border: `1px solid ${c.cardBorder}`,
                      boxShadow: c.cardShadow,
                    }
              }
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#ffb733] text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: isDark ? '#0a0a0f' : '#ffffff',
                    border: '1px solid rgba(255,183,51,0.3)',
                  }}
                >
                  Most popular
                </div>
              )}

              <div>
                <p className="font-medium text-sm mb-1" style={{ color: plan.highlight ? 'rgba(0,0,0,0.6)' : c.textMuted }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold" style={{ color: plan.highlight ? '#000' : c.textPrimary }}>
                    {plan.price}
                  </span>
                  <span className="text-sm mb-1.5" style={{ color: plan.highlight ? 'rgba(0,0,0,0.5)' : c.textSubtle }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm" style={{ color: plan.highlight ? 'rgba(0,0,0,0.55)' : c.textSubtle }}>
                  {plan.desc}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-black/70' : 'text-[#22c55e]'}`} />
                    <span style={{ color: plan.highlight ? 'rgba(0,0,0,0.75)' : c.textMuted }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                    plan.highlight ? 'bg-black text-[#ffb733] hover:bg-[#111]' : ''
                  }`}
                  style={
                    !plan.highlight
                      ? {
                          background: c.ghostBtn,
                          border: `1px solid ${c.ghostBorder}`,
                          color: c.textPrimary,
                        }
                      : {}
                  }
                >
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
