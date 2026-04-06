import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

const annualDiscount = 0.2;

const plans = [
  {
    name: 'Starter',
    price: null,
    priceLabel: 'Free',
    period: '',
    desc: 'Perfect to get started',
    features: ['Unlimited tests', '5 parallel agents', 'Ai test generation', 'Slack & Webhook alert'],
    cta: 'Get started',
    ctaLink: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 499,
    priceLabel: null,
    period: '/month',
    desc: 'Recommended for growing teams',
    features: ['Unlimited tests', '5 parallel agents', 'Ai test generation', 'Slack & Webhook alert', 'Priority support'],
    cta: 'Get started',
    ctaLink: '/signup',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: null,
    priceLabel: "Let's talk",
    period: '',
    desc: 'For larger organisations',
    features: ['Unlimited tests', '5 parallel agents', 'Ai test generation', 'Slack & Webhook alert', 'Priority support'],
    cta: 'Contact sales',
    ctaLink: '/signup',
    highlight: false,
  },
];

export default function Pricing() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);
  const [annual, setAnnual] = useState(false);

  function getDisplayPrice(plan) {
    if (plan.priceLabel) return { label: plan.priceLabel, numeric: null };
    const base = plan.price;
    const val = annual ? Math.round(base * (1 - annualDiscount)) : base;
    return { label: null, numeric: val };
  }


  return (
    <Section
      id="pricing"
      className="py-16 sm:py-24 md:py-36 px-4 sm:px-6 relative overflow-hidden"
      style={{
        background: isDark ? 'rgba(14,12,30,0.45)' : 'rgba(250,250,250,0.45)',
      }}
    >
      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
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

          {/* Toggle */}
          <motion.div
            className="inline-flex items-center gap-1 p-1 rounded-full"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="relative px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: !annual ? '#F29F05' : 'transparent',
                color: !annual ? '#000' : c.textMuted,
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="relative flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: annual ? '#F29F05' : 'transparent',
                color: annual ? '#000' : c.textMuted,
              }}
            >
              Annual
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                style={{
                  background: annual ? 'rgba(0,0,0,0.15)' : 'rgba(242,159,5,0.15)',
                  color: annual ? '#000' : '#F29F05',
                }}
              >
                -20%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-stretch py-4 sm:py-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {plans.map((plan) => {
            const { label, numeric } = getDisplayPrice(plan);
            const isHighlight = plan.highlight;
            const isEnterprise = plan.name === 'Enterprise';

            const glassyBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)';
            const glassy = {
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            };

            const cardStyle = isHighlight
              ? {
                  ...glassy,
                  background: glassyBg,
                  border: '1.5px solid #F29F05',
                  boxShadow: '0 0 40px rgba(242,159,5,0.08), 0 8px 32px rgba(0,0,0,0.3)',
                }
              : isEnterprise
              ? {
                  ...glassy,
                  background: glassyBg,
                  border: '1.5px solid #ce9f4748',
                  boxShadow: '0 0 30px rgba(151,91,255,0.08), 0 8px 32px rgba(0,0,0,0.3)',
                }
              : {
                  ...glassy,
                  background: glassyBg,
                  border: isDark ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(0,0,0,0.15)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                };

            const cardContent = (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className={`relative rounded-[10px] flex flex-col gap-5 transition-all duration-300 ${
                  isHighlight ? 'p-6 sm:p-10 sm:-my-10 sm:scale-[1.04]' : 'p-6 sm:p-7'
                }`}
                style={cardStyle}
              >
                {/* Plan name */}
                <div>
                  <p
                    className={`font-semibold uppercase tracking-widest mb-3 ${isHighlight ? 'text-sm' : 'text-xs'}`}
                    style={{ color: c.textSubtle }}
                  >
                    {plan.name}
                  </p>

                  {/* Price */}
                  <div className="flex items-start gap-0.5 mb-2">
                    <AnimatePresence mode="wait">
                      {label ? (
                        <motion.span
                          key={`${plan.name}-label`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.2 }}
                          className={`font-bold tracking-tight ${isHighlight ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
                          style={{ color: c.textPrimary }}
                        >
                          {label}
                        </motion.span>
                      ) : (
                        <motion.div
                          key={`${plan.name}-${annual}`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start"
                        >
                          <span
                            className={`font-bold mr-0.5 ${isHighlight ? 'text-base sm:text-lg mt-1.5 sm:mt-2' : 'text-base mt-1.5'}`}
                            style={{ color: c.textPrimary }}
                          >
                            $
                          </span>
                          <span
                            className={`font-bold tracking-tight ${isHighlight ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
                            style={{ color: c.textPrimary }}
                          >
                            {numeric}
                          </span>
                          <span
                            className="text-sm self-end mb-1 ml-1"
                            style={{ color: c.textSubtle }}
                          >
                            {annual ? '/mo billed annually' : plan.period}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <p className={isHighlight ? 'text-sm' : 'text-sm'} style={{ color: c.textSubtle }}>
                    {plan.desc}
                  </p>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2.5 ${isHighlight ? 'text-base' : 'text-sm'}`}>
                      <Check
                        className="w-4 h-4 shrink-0"
                        style={{ color: '#F29F05' }}
                        strokeWidth={2.5}
                      />
                      <span style={{ color: c.textMuted }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={plan.ctaLink} className="mt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={
                      isHighlight
                        ? { background: '#F29F05', color: '#000', border: 'none' }
                        : {
                            background: 'transparent',
                            border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                            color: c.textPrimary,
                          }
                    }
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            );

            return cardContent;
          })}
        </motion.div>

        {/* Footer note */}
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
