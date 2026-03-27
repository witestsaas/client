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
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowOverlay(true);
  };

  return (
    <section className="relative pt-24 pb-14 sm:pt-32 sm:pb-18 md:pt-44 md:pb-28 overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] sm:h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,183,51,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-14">
          {/* Left — Text + CTA */}
          <div className="lg:w-[45%] shrink-0 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] tracking-tight mb-4 sm:mb-6"
              style={{ color: c.textPrimary }}
            >
              Ship faster with{' '}
              <br className="hidden sm:block" />
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #ffb733 0%, #ff8c00 50%, #ffb733 100%)' }}
              >
                AI test automation
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mb-8 sm:mb-10"
              style={{ color: c.textMuted }}
            >
              Qalion orchestrates AI agents to generate, execute, and analyse
              your entire test suite — in real-time, at scale, with zero scripting.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
            >
              <Link to="/signup">
                <button className="flex items-center gap-2 font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base bg-[#ffb733] hover:bg-[#e5a22e] text-black transition-colors duration-200">
                  Start for free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right — Video */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:w-[55%] w-full relative"
          >
            <div
              className="rounded-2xl overflow-hidden relative group cursor-pointer"
              style={{
                background: '#000',
                border: `1px solid ${c.mockupBorder}`,
                boxShadow: isDark
                  ? '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 40px 100px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                aspectRatio: '16 / 9',
              }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                onEnded={handleVideoEnd}
                onClick={handlePlay}
                poster="/uploads/qalion-demo-poster.jpg"
              >
                <source src="/uploads/qalion-demo.mp4" type="video/mp4" />
              </video>

              {/* Play / pause overlay */}
              {showOverlay && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                  onClick={handlePlay}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#ffb733] hover:bg-[#e5a22e] transition-colors">
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                  </div>
                </div>
              )}

              {/* Controls bar */}
              {isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Pause className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom glow */}
            <div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(255,183,51,0.15) 0%, transparent 70%)' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
