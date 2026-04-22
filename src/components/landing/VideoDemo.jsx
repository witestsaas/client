import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Maximize2 } from 'lucide-react';
import Section from './ui/Section';
import { fadeUp } from '../../utils/motion';
import { getLandingColors } from '../../utils/theme-colors';

export default function VideoDemo() {
  const isDark = true;
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
    <Section id="demo" className="py-28 md:py-36 px-6" style={{ background: c.sectionBg1 }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            variants={fadeUp}
            className="text-[#F29F05] font-semibold text-xs uppercase tracking-[0.2em] mb-4"
          >
            See it in action
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: c.textPrimary }}
          >
            From zero to full coverage
            <br />
            in 90 seconds
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-base max-w-xl mx-auto"
            style={{ color: c.textMuted }}
          >
            Watch how Qalion generates tests, executes them across browsers,
            and delivers real-time AI insights — all autonomously.
          </motion.p>
        </div>

        {/* Video container */}
        <motion.div
          variants={fadeUp}
          className="relative mx-auto max-w-4xl"
        >
          <div
            className="rounded-2xl overflow-hidden relative group"
            style={{
              background: '#000',
              border: `1px solid ${c.mockupBorder}`,
              boxShadow: isDark
                ? '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 40px 100px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              aspectRatio: '16 / 9',
            }}
          >
            {/* Video element */}
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

            {/* Play overlay */}
            {showOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
                }}
                onClick={handlePlay}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,183,51,0.9)',
                    boxShadow: '0 0 60px rgba(255,183,51,0.4), 0 0 120px rgba(255,183,51,0.15)',
                  }}
                >
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-black ml-1" fill="black" />
                </motion.div>
              </motion.div>
            )}

            {/* Controls bar (visible on hover when playing) */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
              >
                <button
                  onClick={handlePlay}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFullscreen}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom glow */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(255,183,51,0.12) 0%, transparent 70%)' }}
          />
        </motion.div>
      </div>
    </Section>
  );
}
