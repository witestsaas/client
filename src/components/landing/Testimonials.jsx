import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Section from './ui/Section';
import { fadeUp, staggerContainer } from '../../utils/motion';
import { testimonials } from '../../constants/landing';
import { getLandingColors } from '../../utils/theme-colors';

export default function Testimonials() {
  const isDark = true;
  const c = getLandingColors(isDark);

  return (
    <Section className="py-28 md:py-36 px-6" style={{ background: c.sectionBg1 }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-[#F29F05] font-semibold text-xs uppercase tracking-[0.2em] mb-4">
            Testimonials
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold" style={{ color: c.textPrimary }}>
            Loved by engineering teams
          </motion.h2>
        </div>

        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <motion.div
              key={t.author}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
              style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, boxShadow: c.cardShadow }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F29F05] text-[#F29F05]" />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: c.textMuted }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-sm" style={{ color: c.textPrimary }}>{t.author}</p>
                <p className="text-xs" style={{ color: c.textSubtle }}>{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
