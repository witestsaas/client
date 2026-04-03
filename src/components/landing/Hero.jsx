import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Pause, Maximize2 } from 'lucide-react';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

export default function Hero() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const handlePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setShowOverlay(false);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowOverlay(true);
  };

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-0">

          {/* Left — Text + CTA */}
          <div className="lg:w-1/2 shrink-0 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-bold leading-[1.0] tracking-tight mb-6 sm:mb-8"
              style={{
                fontFamily: "'Aeonik', sans-serif",
                fontWeight: 700,
                color: isDark ? '#ffffff' : c.textPrimary,
                fontSize: 'clamp(4rem, 10vw, 4.5rem)',
              }}
            >
              Ship faster<br />
              with AI test<br />
              <span style={isDark ? { color: '#ffffff' } : {
                backgroundImage: 'linear-gradient(135deg, #F2B705 0%, #F29F05 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                automation
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg leading-relaxed max-w-sm mb-8 sm:mb-10"
              style={{ color: isDark ? 'rgba(255,255,255,0.45)' : c.textMuted }}
            >
              Qalion orchestrates AI agents to generate, execute, and analyse
              your entire test suite — in real-time, at scale, with zero scripting.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Link to="/signup">
                <button
                  className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-sm sm:text-base transition-colors duration-200"
                  style={{ background: '#F2B705', color: '#000' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#d9a400'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F2B705'}
                >
                  Start for free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right — Video (sans card, fondu dans le fond) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="lg:w-1/2 w-full relative flex items-center justify-center"
          >
            <div
              className="relative w-full cursor-pointer group"
              style={{ aspectRatio: '16 / 9' }}
              onClick={handlePlay}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-xl"
                style={{ opacity: 0.85 }}
                playsInline
                onEnded={handleVideoEnd}
                poster="/uploads/qalion-demo-poster.jpg"
              >
                <source src="/uploads/qalion-demo.mp4" type="video/mp4" />
              </video>

              {/* Play overlay */}
              {showOverlay && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white ml-1" />
                  </motion.div>
                </div>
              )}

              {/* Controls */}
              {isPlaying && (
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); handlePlay(); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Pause className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleFullscreen(); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
