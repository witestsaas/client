import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { plans } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

const annualDiscount = 0.2; // 20% off

export default function Pricing() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);
  const [annual, setAnnual] = useState(false);

  function getPrice(plan) {
    if (plan.price === 'Free' || plan.price === "Let's talk") return plan.price;
    const base = parseFloat(plan.price.replace('$', ''));
    const discounted = annual ? Math.round(base * (1 - annualDiscount)) : base;
    return `$${discounted}`;
  }

  return (
    <Section
      id="pricing"
      className="py-16 sm:py-24 md:py-36 px-4 sm:px-6 relative overflow-hidden"
      style={{
        background: isDark ? 'rgba(19,17,42,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Decorative overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(242,183,5,0.08) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(242,183,5,0.05) 0%, transparent 55%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.p
            className="text-[#F29F05] font-semibold text-xs uppercase tracking-[0.2em] mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Pricing
          </motion.p>
          <motion.h2
            className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3"
            style={{ color: c.textPrimary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            className="text-base mb-8"
            style={{ color: c.textMuted }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            No hidden fees. Cancel anytime.
          </motion.p>

          {/* Toggle mensuel / annuel */}
          <motion.div
            className="inline-flex items-center gap-3 px-1.5 py-1.5 rounded-full relative"
            style={{
              background: c.cardBg,
              border: `1px solid ${c.cardBorder}`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 z-10"
              style={{ color: !annual ? (isDark ? '#000' : '#fff') : c.textMuted }}
            >
              {!annual && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#F29F05' }}
                />
              )}
              <span className="relative z-10">Monthly</span>
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 z-10 flex items-center gap-2"
              style={{ color: annual ? (isDark ? '#000' : '#fff') : c.textMuted }}
            >
              {annual && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#F29F05' }}
                />
              )}
              <span className="relative z-10">Annual</span>
              <span className="relative z-10 text-xs font-bold text-[#F29F05] bg-[#F29F05]/10 px-1.5 py-0.5 rounded-full leading-none">
                -20%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 items-start"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {plans.map((plan, i) => {
            const isHighlight = plan.highlight;
            const displayPrice = getPrice(plan);

            return (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                whileHover={{ y: -10 }}
                whileTap={{ scale: 0.98 }}
                className="relative rounded-2xl p-5 sm:p-7 flex flex-col gap-5 transition-all duration-300 cursor-pointer"
                style={
                  isHighlight
                    ? {
                        background: 'linear-gradient(140deg, #F29F05 0%, #ff8c00 55%, #f5a623 100%)',
                        border: '1px solid rgba(255,183,51,0.6)',
                        boxShadow: '0 20px 60px rgba(242,183,5,0.25)',
                      }
                    : {
                        background: c.cardBg,
                        border: `1px solid ${c.cardBorder}`,
                        boxShadow: c.cardShadow,
                      }
                }
              >
                {/* Badge Most Popular */}
                {isHighlight && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{
                      background: isDark ? '#13112a' : '#ffffff',
                      border: '1px solid rgba(242,183,5,0.4)',
                      color: '#F29F05',
                    }}
                  >
                    <Zap className="w-3 h-3" />
                    Most popular
                  </div>
                )}

                {/* Plan name + desc */}
                <div>
                  <p
                    className="font-semibold text-xs uppercase tracking-widest mb-3"
                    style={{ color: isHighlight ? 'rgba(0,0,0,0.5)' : c.textSubtle }}
                  >
                    {plan.name}
                  </p>

                  {/* Prix avec animation */}
                  <div className="flex items-end gap-1 mb-2">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.name}-${annual}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                        className="text-4xl font-bold tracking-tight"
                        style={{ color: isHighlight ? '#000' : c.textPrimary }}
                      >
                        {displayPrice}
                      </motion.span>
                    </AnimatePresence>
                    {plan.period && (
                      <span
                        className="text-sm mb-1.5"
                        style={{ color: isHighlight ? 'rgba(0,0,0,0.45)' : c.textSubtle }}
                      >
                        {annual ? '/mo billed annually' : plan.period}
                      </span>
                    )}
                  </div>

                  <p
                    className="text-sm"
                    style={{ color: isHighlight ? 'rgba(0,0,0,0.55)' : c.textSubtle }}
                  >
                    {plan.desc}
                  </p>
                </div>

                {/* Divider */}
                <div
                  className="h-px w-full"
                  style={{
                    background: isHighlight
                      ? 'rgba(0,0,0,0.1)'
                      : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.06)',
                  }}
                />

                {/* Features */}
                <ul className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle
                        className="w-4 h-4 shrink-0"
                        style={{ color: isHighlight ? 'rgba(0,0,0,0.6)' : '#F29F05' }}
                      />
                      <span style={{ color: isHighlight ? 'rgba(0,0,0,0.75)' : c.textMuted }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/signup" className="mt-1">
                  <motion.button
                    whileHover={
                      isHighlight
                        ? { scale: 1.02, backgroundColor: 'rgba(0,0,0,0.12)', borderColor: 'rgba(0,0,0,0.6)' }
                        : { scale: 1.02 }
                    }
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={
                      isHighlight
                        ? {
                            background: 'transparent',
                            border: '1.5px solid rgba(0,0,0,0.35)',
                            color: '#000',
                          }
                        : i === 2
                        ? {
                            background: '#F29F05',
                            color: isDark ? '#000' : '#fff',
                            border: 'none',
                          }
                        : {
                            background: c.ghostBtn,
                            border: `1px solid ${c.ghostBorder}`,
                            color: c.textPrimary,
                          }
                    }
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Note bas de page */}
        <motion.p
          className="text-center text-xs mt-8"
          style={{ color: c.textSubtle }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>
      </div>
    </Section>
  );
}
