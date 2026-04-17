import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from './ui/Section';
import { fadeUp } from '../../utils/motion';

export default function FinalCTA() {
  const isDark = true;

  return (
    <Section className="py-20 sm:py-32 md:py-40 px-4 sm:px-6 relative overflow-hidden" style={{ background: isDark ? 'rgba(14,12,30,0.45)' : 'rgba(250,250,250,0.45)' }}>
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.h2 
          variants={fadeUp} 
          className="text-3xl sm:text-4xl md:text-6xl font-bold mb-5 leading-tight"
          style={{ color: isDark ? '#ffffff' : '#0D0D0D' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Ready to automate{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #F29F05, #ff8c00)' }}
          >
            your testing?
          </span>
        </motion.h2>
        <motion.p 
          variants={fadeUp} 
          className="text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed"
          style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Join engineering teams shipping faster with confidence.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold px-6 sm:px-10 py-3.5 rounded-xl text-sm sm:text-base bg-[#F29F05] hover:bg-[#e5a22e] text-black transition-colors duration-200">
              Get started free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link to="/signin" className="w-full sm:w-auto">
            <button
              className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-10 py-3.5 rounded-xl text-sm sm:text-base transition-colors duration-200"
              style={{
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
            >
              Sign in
            </button>
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
