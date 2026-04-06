import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle, Loader2, Zap, BarChart3, Globe } from 'lucide-react';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

/* ── Pulse dot ─────────────────────────────────────────────────── */
function PulseDot({ color = '#22c55e', size = 8 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <motion.span
        className="absolute inline-flex rounded-full"
        style={{ width: size, height: size, background: color, opacity: 0.4 }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative inline-flex rounded-full" style={{ width: size, height: size, background: color }} />
    </span>
  );
}

/* ── Agent row ─────────────────────────────────────────────────── */
function AgentRow({ name, progress, passed, total, live, accent, c, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-lg px-3 py-2 border flex items-center gap-3"
      style={{
        borderColor: live ? `${accent}25` : 'transparent',
        background: live ? `${accent}06` : (c.mockupBg ?? 'transparent'),
      }}
    >
      <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: c.textMuted }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium truncate" style={{ color: c.textPrimary }}>{name}</span>
          <span className="text-[10px] font-mono ml-2 shrink-0" style={{ color: c.textMuted }}>
            {passed}/{total}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${accent}15` }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.9, delay: delay + 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>
      {live
        ? <PulseDot color={accent} size={7} />
        : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#22c55e' }} />
      }
    </motion.div>
  );
}

/* ── Hero mockup canvas ─────────────────────────────────────────── */
function HeroCanvas({ c, isDark }) {
  const accent = '#F2B705';
  const agents = [
    { name: 'Chrome Desktop', progress: 1, passed: 12, total: 12, live: false },
    { name: 'Firefox macOS', progress: 1, passed: 11, total: 12, live: false },
    { name: 'Safari Mobile', progress: 0.65, passed: 5, total: 8, live: true },
    { name: 'Edge Windows', progress: 0.82, passed: 9, total: 12, live: true },
  ];

  const stats = [
    { label: 'Tests passed', value: '37', icon: CheckCircle2, color: '#22c55e' },
    { label: 'Running', value: '7', icon: Loader2, color: accent, spin: true },
    { label: 'Failed', value: '2', icon: XCircle, color: '#ef4444' },
  ];

  return (
    <motion.div
      className="rounded-2xl border overflow-hidden relative w-full h-full"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        background: c.mockupBg,
        boxShadow: isDark
          ? '0 20px 60px rgba(0,0,0,0.32), 0 0 40px rgba(242,183,5,0.04)'
          : '0 20px 60px rgba(0,0,0,0.08), 0 0 40px rgba(242,183,5,0.04)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(242,159,5,0.5) 50%, transparent 100%)' }}
      />

      {/* Browser bar */}
      <div
        className="h-9 px-4 flex items-center gap-2.5"
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
        }}
      >
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 max-w-xs ml-2">
          <div
            className="rounded px-2.5 py-1.5 flex items-center gap-2"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: `${accent}60` }} />
            <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>app.qalion.io/runs/latest</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <PulseDot color="#22c55e" size={6} />
          <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 h-[calc(100%-2.25rem)]">

        {/* Run header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: accent }} />
            <span className="text-sm font-semibold" style={{ color: c.textPrimary }}>
              Run #142 — E2E Suite
            </span>
          </div>
          <span
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
            style={{ color: accent, background: `${accent}12` }}
          >
            In Progress
          </span>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-3 gap-2"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-2.5 flex flex-col gap-1 border"
              style={{
                borderColor: `${s.color}20`,
                background: `${s.color}08`,
              }}
            >
              <div className="flex items-center gap-1.5">
                {s.spin
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
                      <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    </motion.div>
                  : <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                }
                <span className="text-[10px]" style={{ color: c.textMuted }}>{s.label}</span>
              </div>
              <span className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Agent lanes */}
        <div className="flex flex-col gap-1.5 flex-1">
          {agents.map((a, i) => (
            <AgentRow key={a.name} {...a} accent={accent} c={c} delay={0.3 + i * 0.12} />
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-[11px] font-semibold" style={{ color: accent }}>
              44 tests · 4 agents · avg 1.8s
            </span>
          </div>
          <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: accent }} />
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default function Hero() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left — Text + CTA */}
          <div className="lg:w-[38%] shrink-0 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-bold leading-[1.0] tracking-tight mb-6 sm:mb-8"
              style={{
                fontFamily: "'Aeonik', sans-serif",
                fontWeight: 700,
                color: isDark ? '#ffffff' : c.textPrimary,
                fontSize: 'clamp(3rem, 5vw, 4.5rem)',
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
              className="text-base sm:text-lg leading-relaxed mb-8 sm:mb-10"
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
                  className="inline-flex items-center gap-2 font-semibold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base transition-colors duration-200"
                  style={{ background: '#F2B705', color: '#000' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#d9a400'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F2B705'}
                >
                  Start for free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right — Canvas mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="lg:w-[62%] w-full"
            style={{ height: 'clamp(400px, 55vh, 600px)' }}
          >
            <HeroCanvas c={c} isDark={isDark} />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
