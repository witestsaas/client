import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from './ui/Section';
import { fadeUp } from '../../utils/motion';

export default function FinalCTA() {
  return (
    <Section className="py-20 sm:py-32 md:py-40 px-4 sm:px-6 relative overflow-hidden" style={{ background: 'rgba(19,17,42,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* Enhanced glows */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,183,51,0.12) 0%, rgba(94, 0, 255, 0.08) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Accent glows */}
      <div
        className="absolute -top-40 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(242, 183, 5, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="absolute -bottom-40 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(94, 0, 255, 0.12) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.h2 
          variants={fadeUp} 
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-5 leading-tight"
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
          className="text-white/40 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Join engineering teams shipping faster with confidence.
        </motion.p>
        <motion.div 
          variants={fadeUp} 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link to="/signup">
            <button className="flex items-center gap-2 font-semibold px-7 sm:px-10 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base bg-[#F29F05] hover:bg-[#e5a22e] text-black transition-colors duration-200">
              Get started free <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link to="/signin">
            <button className="px-7 sm:px-10 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base text-white/50 hover:text-white/80 transition-colors duration-200" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              Sign in
            </button>
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
