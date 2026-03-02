import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Stats from '../components/landing/Stats';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';
import { useTheme } from '../utils/theme-context';

function SectionWrapper({ children }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        boxShadow: isDark
          ? '0 10px 40px rgba(0,0,0,0.4)'
          : '0 6px 24px rgba(0,0,0,0.07)',
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f8fc] dark:bg-[#020205] transition-colors duration-300">
      <Navbar />
      <SectionWrapper><Hero /></SectionWrapper>
      <SectionWrapper><Features /></SectionWrapper>
      <SectionWrapper><HowItWorks /></SectionWrapper>
      <SectionWrapper><Stats /></SectionWrapper>
      <SectionWrapper><Testimonials /></SectionWrapper>
      <SectionWrapper><Pricing /></SectionWrapper>
      <FinalCTA />
      <Footer />
    </div>
  );
}
