import { motion } from 'framer-motion';
import { useTheme } from '../utils/theme-context.tsx';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Stats from '../components/landing/Stats';
import Pricing from '../components/landing/Pricing';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';
import AIChatWidget from '../components/AIChatWidget';

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#13112a] transition-colors duration-500" style={{ overflow: 'hidden' }}>
      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>

        {/* Blob 1 — Purple dominant, lower-left */}
        <motion.div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            width: '1300px',
            height: '1300px',
            top: 'calc(50vh - 750px)',
            left: '-380px',
            background: 'radial-gradient(circle at 55% 45%, #9B6FFF 0%, #5E00FF 28%, #3B00CC 52%, #1a0070 68%, transparent 80%)',
            opacity: isDark ? 0.38 : 0.09,
            filter: 'blur(90px)',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
          animate={{
            scale: [1, 1.07, 0.96, 1.04, 1],
            x: [0, 35, -18, 22, 0],
            y: [0, -45, 30, -12, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Blob 2 — Amber/Gold, upper-right */}
        <motion.div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            width: '950px',
            height: '950px',
            top: 'calc(50vh - 700px)',
            right: '-280px',
            background: 'radial-gradient(circle at 42% 52%, #FDE68A 0%, #F2B705 18%, #D97706 42%, #92400E 62%, transparent 78%)',
            opacity: isDark ? 0.33 : 0.10,
            filter: 'blur(72px)',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
          animate={{
            scale: [1, 1.1, 0.94, 1.06, 1],
            x: [0, -38, 20, -14, 0],
            y: [0, 55, -32, 22, 0],
          }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Blob 3 — Violet accent, upper-center (pont entre les deux) */}
        <motion.div
          style={{
            position: 'absolute',
            borderRadius: '50%',
            width: '520px',
            height: '520px',
            top: '-120px',
            left: 'calc(50% - 260px)',
            background: 'radial-gradient(circle at 50% 50%, #C4B5FD 0%, #7C3AED 38%, #4c00cc 60%, transparent 75%)',
            opacity: isDark ? 0.25 : 0.07,
            filter: 'blur(50px)',
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
          animate={{
            scale: [1, 1.18, 0.88, 1.12, 1],
            x: [0, 25, -14, 18, 0],
            y: [0, 35, -20, 12, 0],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />

      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
        <Footer />
      </div>
      <AIChatWidget />
    </div>
  );
}
