import React from 'react';
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
      className="py-28 px-6 relative"
      style={{ background: isDark ? 'linear-gradient(180deg, #05050a 0%, #020205 100%)' : 'linear-gradient(180deg, #f4f5fb 0%, #f8f8fc 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-[#ffb733] font-bold text-xs uppercase tracking-[0.25em] mb-3">Pricing</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-bold dark:text-white text-gray-900 mb-3">Simple, transparent pricing</motion.h2>
          <motion.p variants={fadeUp} className="text-base" style={{ color: c.textMuted }}>No hidden fees. Cancel anytime.</motion.p>
        </div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-5 items-center">
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={fadeUp}
              whileHover={{ y: -8 }}
              className="relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300"
              style={plan.highlight ? {
                background: 'linear-gradient(135deg, #ffb733 0%, #ff8c00 100%)',
                border: '1px solid rgba(255,183,51,0.5)',
                boxShadow: '0 0 60px rgba(255,183,51,0.2), 0 20px 60px rgba(0,0,0,0.4)',
              } : {
                background: c.cardBg,
                border: `1px solid ${c.cardBorder}`,
                boxShadow: c.cardShadow,
              }}>
              {plan.highlight && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#ffb733] text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: c.sectionBg3, border: '1px solid rgba(255,183,51,0.4)' }}
                  animate={{ boxShadow: ['0 0 0px rgba(255,183,51,0)', '0 0 15px rgba(255,183,51,0.4)', '0 0 0px rgba(255,183,51,0)'] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  Most popular
                </motion.div>
              )}

              <div>
                <p className="font-semibold text-sm mb-1"
                  style={{ color: plan.highlight ? 'rgba(0,0,0,0.6)' : c.textMuted }}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-black' : 'dark:text-white text-gray-900'}`}>{plan.price}</span>
                  <span className="text-sm mb-1.5"
                    style={{ color: plan.highlight ? 'rgba(0,0,0,0.5)' : c.textSubtle }}>{plan.period}</span>
                </div>
                <p className="text-sm" style={{ color: plan.highlight ? 'rgba(0,0,0,0.55)' : c.textSubtle }}>{plan.desc}</p>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-black' : 'text-[#22c55e]'}`} />
                    <span style={{ color: plan.highlight ? 'rgba(0,0,0,0.75)' : c.textMuted }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight ? 'bg-black text-[#ffb733] hover:bg-[#111]' : ''
                  }`}
                  style={!plan.highlight ? { background: c.ghostBtn, border: `1px solid ${c.ghostBorder}`, color: c.textPrimary } : {}}>
                  {plan.cta}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
