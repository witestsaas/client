import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from './ui/Section';
import { fadeUp } from '../../utils/motion';

// FinalCTA intentionally stays dark in both modes for maximum visual contrast.
export default function FinalCTA() {
  return (
    <Section className="py-28 px-6 relative overflow-hidden" style={{ background: '#020205' }}>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,183,51,0.07) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="opacity-[0.02]">
          <defs>
            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.h2 variants={fadeUp} className="text-5xl md:text-7xl font-bold text-white mb-5 leading-tight">
          Ready to automate<br />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #ffb733, #ff6a00)' }}>
            your testing?
          </span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-white/40 text-lg mb-10 leading-relaxed">
          Join hundreds of engineering teams shipping faster and with more confidence.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 80px rgba(255,183,51,0.4), 0 0 160px rgba(255,100,0,0.15)' }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-base overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ffb733 0%, #ff8c00 100%)', color: '#000' }}>
              <motion.span className="absolute inset-0 bg-white/25"
                initial={{ x: '-100%', skewX: '-15deg' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.5 }} />
              Get started free <ChevronRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <Link to="/signin">
            <motion.button whileHover={{ scale: 1.03 }}
              className="px-10 py-4 rounded-xl text-base text-white/60 hover:text-white transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
              Sign in
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
