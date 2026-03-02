import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import Aurora from './ui/Aurora';
import ParticleNetwork from './ui/ParticleNetwork';
import MorphBlob from './ui/MorphBlob';
import FloatingCode from './ui/FloatingCode';
import { codeLines } from '../../constants/landing';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

const floatingItems = [
  { text: codeLines[0].text, color: codeLines[0].color, style: { top: '20%', left: '4%',   delay: 0,   duration: 7   } },
  { text: codeLines[1].text, color: codeLines[1].color, style: { top: '35%', left: '2%',   delay: 1.5, duration: 8   } },
  { text: codeLines[2].text, color: codeLines[2].color, style: { top: '55%', left: '5%',   delay: 3,   duration: 6.5 } },
  { text: codeLines[3].text, color: codeLines[3].color, style: { top: '22%', right: '3%',  delay: 0.8, duration: 7.5 } },
  { text: codeLines[4].text, color: codeLines[4].color, style: { top: '40%', right: '2%',  delay: 2.2, duration: 8.5 } },
  { text: codeLines[5].text, color: codeLines[5].color, style: { top: '60%', right: '4%',  delay: 4,   duration: 6   } },
  { text: codeLines[6].text, color: codeLines[6].color, style: { top: '70%', left: '8%',   delay: 2,   duration: 9   } },
  { text: codeLines[7].text, color: codeLines[7].color, style: { top: '75%', right: '6%',  delay: 1,   duration: 7   } },
];

const mockupStats = [
  { label: 'Tests Run',    value: '12,840', trend: '+18%', color: '#ffb733', icon: '⚡' },
  { label: 'Pass Rate',   value: '98.2%',  trend: '+4.1%', color: '#22c55e', icon: '✓' },
  { label: 'Avg Duration', value: '1.4s',  trend: '-23%',  color: '#60a5fa', icon: '⏱' },
];

const progressBars = [
  { label: 'Auth module',   pct: 100, color: '#22c55e' },
  { label: 'UI rendering',  pct: 78,  color: '#ffb733' },
  { label: 'API validation', pct: 45, color: '#60a5fa' },
  { label: 'Edge cases',    pct: 12,  color: '#c084fc' },
];

export default function Hero() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Aurora />
      <ParticleNetwork />

      <MorphBlob style={{
        width: 320, height: 320, top: '15%', left: '10%',
        background: 'radial-gradient(circle, rgba(255,140,30,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <MorphBlob style={{
        width: 280, height: 280, bottom: '20%', right: '12%',
        background: 'radial-gradient(circle, rgba(100,130,255,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {floatingItems.map((item, i) => (
        <FloatingCode key={i} text={item.text} color={item.color} style={item.style} />
      ))}

      <motion.div
        style={{ y: heroY, opacity: heroOpacity, zIndex: 10 }}
        className="relative text-center max-w-5xl mx-auto px-6 pt-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,183,51,0.12) 0%, rgba(255,120,0,0.06) 100%)',
            border: '1px solid rgba(255,183,51,0.25)',
            backdropFilter: 'blur(12px)',
          }}>
          <motion.span className="w-2 h-2 rounded-full bg-[#ffb733]"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }} />
          <span className="text-[#ffb733] text-sm font-semibold">AI-Powered Test Automation</span>
          <span className="text-[#ffb733]/40">·</span>
          <span className="text-xs" style={{ color: c.textSubtle }}>v2.0 now with LangGraph</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-6xl md:text-8xl font-bold leading-[1.05] tracking-tight mb-6 dark:text-white text-gray-900">
          Test smarter with{' '}
          <br />
          <span className="relative inline-block">
            <motion.span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #ffb733 0%, #ff6a00 40%, #ffb733 80%, #ffe066 100%)', backgroundSize: '200% 200%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
              autonomous
            </motion.span>
            <motion.span
              className="absolute -bottom-1 left-0 h-px rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, #ffb733, #ff6a00, transparent)' }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.7 }} />
          </span>{' '}
          AI agents
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.42 }}
          className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ color: c.textMuted }}>
          Qalion orchestrates LangGraph agents to generate, execute, and analyse your entire test suite — in real-time, at scale, with zero scripting.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 0 60px rgba(255,183,51,0.5), 0 0 120px rgba(255,100,0,0.2)' }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2.5 font-bold px-9 py-4 rounded-xl text-base overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ffb733 0%, #ff8c00 100%)', color: '#000' }}>
              <motion.span className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%', skewX: '-20deg' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.5 }} />
              Start for free <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-9 py-4 rounded-xl text-base transition-all dark:text-white/70 text-gray-500 dark:hover:text-white hover:text-gray-900"
            style={{ border: `1px solid ${c.ghostBorder}`, background: c.ghostBtn }}>
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,183,51,0.15)', border: '1px solid rgba(255,183,51,0.3)' }}
              animate={{ boxShadow: ['0 0 0px rgba(255,183,51,0)', '0 0 12px rgba(255,183,51,0.4)', '0 0 0px rgba(255,183,51,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              <Play className="w-3 h-3 fill-[#ffb733] text-[#ffb733] ml-0.5" />
            </motion.div>
            Watch demo
          </motion.button>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mx-auto max-w-4xl">
          <motion.div className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,183,51,0.3), rgba(100,130,255,0.15), rgba(255,183,51,0.1))' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }} />

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: c.mockupBg,
              border: `1px solid ${c.mockupBorder}`,
              boxShadow: c.mockupShadow,
              backdropFilter: 'blur(20px)',
            }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ background: c.mockupBarBg, borderBottom: `1px solid ${c.mockupBorder}` }}>
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="flex-1 mx-3">
                <div className="rounded-md h-6 max-w-xs mx-auto flex items-center justify-center px-3"
                  style={{ background: c.mockupUrlBg, border: `1px solid ${c.mockupUrlBorder}` }}>
                  <span className="text-xs font-mono" style={{ color: c.mockupUrlText }}>app.qalion.io/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="p-5 grid grid-cols-3 gap-3">
              {mockupStats.map((stat) => (
                <motion.div key={stat.label} whileHover={{ scale: 1.03 }}
                  className="rounded-xl p-4 border relative overflow-hidden"
                  style={{ background: c.mockupStatBg, borderColor: c.mockupStatBorder }}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-30"
                    style={{ background: stat.color, transform: 'translate(40%, -40%)' }} />
                  <div className="text-xs mb-2" style={{ color: c.mockupLabel }}>{stat.icon} {stat.label}</div>
                  <div className="font-bold text-xl mb-1" style={{ color: c.textPrimary }}>{stat.value}</div>
                  <div className="text-xs font-semibold" style={{ color: stat.color }}>{stat.trend}</div>
                </motion.div>
              ))}

              {/* Live execution panel */}
              <div className="col-span-3 rounded-xl p-4 border"
                style={{ background: c.mockupPanelBg, borderColor: c.mockupPanelBorder }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <motion.div className="w-2 h-2 rounded-full bg-[#22c55e]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }} />
                    <span className="text-xs font-mono" style={{ color: c.mockupLiveLabel }}>Live execution — login_flow_e2e.spec.ts</span>
                  </div>
                  <span className="text-[#ffb733] text-xs font-semibold">AI Agent Running</span>
                </div>
                <div className="space-y-2.5">
                  {progressBars.map((bar) => (
                    <div key={bar.label} className="flex items-center gap-3">
                      <span className="text-xs w-24 shrink-0 font-mono" style={{ color: c.mockupLabel }}>{bar.label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: c.mockupProgressBg }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bar.pct}%` }}
                          transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                          className="h-full rounded-full relative overflow-hidden"
                          style={{ background: `linear-gradient(90deg, ${bar.color}90, ${bar.color})` }}>
                          <motion.div className="absolute inset-0 bg-white/30"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: bar.pct === 100 ? 999 : 0 }} />
                        </motion.div>
                      </div>
                      <span className="text-xs w-8 text-right font-mono" style={{ color: c.mockupPct }}>{bar.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(255,183,51,0.2) 0%, transparent 70%)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
