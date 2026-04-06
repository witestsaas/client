import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, Zap,
  BarChart3, ClipboardList, Layers, Play,
  Bot, Activity, Users, FolderOpen,
} from 'lucide-react';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

/* ── Dashboard mockup ───────────────────────────────────────────── */
function HeroCanvas() {
  const accent   = '#FFAA00';
  const bg       = '#13112a';
  const sidebarBg = '#1c1a2e';
  const cardBg   = '#1e1c32';
  const border   = 'rgba(255,255,255,0.07)';

  const navItems = [
    { label: 'Dashboard', icon: BarChart3, active: true },
    { label: 'Test Cases',  icon: ClipboardList },
    { label: 'Test Plans',  icon: Layers },
    { label: 'Test Runs',   icon: Play },
    { label: 'Reports',     icon: BarChart3 },
  ];

  const analysisItems = [
    { label: 'Insights',  icon: Bot },
    { label: 'Coverage',  icon: Activity },
  ];

  const statCards = [
    { label: 'PROJECTS',     value: '12',  color: '#F29F05', bg: '#F29F0518' },
    { label: 'TEST CASES',   value: '248', color: '#3b82f6', bg: '#3b82f618' },
    { label: 'SUCCESS RATE', value: '94%', color: '#22c55e', bg: '#22c55e18' },
    { label: 'FAILURES',     value: '17',  color: '#ef4444', bg: '#ef444418' },
  ];

  const bars = [30, 52, 42, 68, 58, 78, 62, 74, 56, 70];

  const recentRuns = [
    { name: 'E2E Suite',  pct: '94%', color: '#22c55e' },
    { name: 'API Tests',  pct: '67%', color: accent },
    { name: 'Unit Tests', pct: '100%', color: '#22c55e' },
  ];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden relative w-full h-full flex flex-col"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 40px rgba(255,170,0,0.04)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,170,0,0.45),transparent)' }}
      />

      {/* Body: sidebar + main */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <div className="w-[130px] shrink-0 flex flex-col h-full"
          style={{ background: sidebarBg, borderRight: `1px solid ${border}` }}
        >
          {/* Logo */}
          <div className="px-3 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: border }}>
            <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
              style={{ background: `${accent}20`, boxShadow: `0 0 8px ${accent}30` }}
            >
              <Zap className="w-3 h-3" style={{ color: accent }} />
            </div>
            <span className="text-[11px] font-bold tracking-widest text-white">QALION</span>
          </div>

          {/* Org switcher */}
          <div className="px-2 py-2 border-b" style={{ borderColor: border }}>
            <p className="text-[7px] uppercase tracking-widest mb-1 px-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Organization</p>
            <div className="rounded-md px-2 py-1 flex items-center justify-between gap-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}` }}
            >
              <span className="text-[9px] text-white truncate">Wirky Group</span>
              <ChevronDown className="w-2.5 h-2.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-2 space-y-0.5">
            {navItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 rounded-md px-2 py-1"
                style={{ background: item.active ? accent : 'transparent' }}
              >
                <item.icon className="w-2.5 h-2.5 shrink-0"
                  style={{ color: item.active ? '#1a1826' : 'rgba(255,255,255,0.35)' }}
                />
                <span className="text-[9px] font-medium"
                  style={{ color: item.active ? '#1a1826' : 'rgba(255,255,255,0.5)' }}
                >
                  {item.label}
                </span>
              </div>
            ))}

            <p className="text-[7px] uppercase tracking-widest px-2 pt-2 pb-0.5"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >Analysis</p>

            {analysisItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 rounded-md px-2 py-1">
                <item.icon className="w-2.5 h-2.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
              </div>
            ))}

            <p className="text-[7px] uppercase tracking-widest px-2 pt-2 pb-0.5"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >Platform</p>
            <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
              <Users className="w-2.5 h-2.5 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Organizations</span>
            </div>
          </nav>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <div className="h-9 px-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: `1px solid ${border}`, background: 'rgba(255,255,255,0.01)' }}
          >
            <div className="flex items-center gap-1.5 rounded-md px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}` }}
            >
              <FolderOpen className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Select Project</span>
              <ChevronDown className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
            <motion.div
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-bold"
              style={{ background: accent, color: '#1a1826' }}
              animate={{ boxShadow: [`0 0 0px ${accent}00`, `0 0 10px ${accent}55`, `0 0 0px ${accent}00`] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap className="w-2.5 h-2.5" />
              Quick Run
            </motion.div>
          </div>

          {/* Page content */}
          <div className="flex-1 p-3 flex flex-col gap-2 min-h-0 overflow-hidden">

            {/* Title row */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <div>
                <h3 className="text-xs font-bold text-white leading-none">Dashboard</h3>
                <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Overview of your testing suite performance.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="rounded-md px-2 py-1 text-[9px] font-semibold"
                  style={{ background: accent, color: '#1a1826' }}
                >Open Projects</div>
                <div className="rounded-md px-2 py-1 text-[9px] font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: `1px solid ${border}` }}
                >Team Access</div>
              </div>
            </motion.div>

            {/* Stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-4 gap-1.5"
            >
              {statCards.map((s) => (
                <div key={s.label} className="rounded-xl p-2"
                  style={{ background: cardBg, border: `1px solid ${border}` }}
                >
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center mb-1.5"
                    style={{ background: s.bg }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  </div>
                  <div className="text-sm font-bold text-white leading-none">{s.value}</div>
                  <div className="text-[7px] mt-0.5 uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Bottom panels */}
            <div className="grid grid-cols-5 gap-1.5 flex-1 min-h-0">

              {/* Velocity chart */}
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="col-span-3 rounded-xl p-2.5 flex flex-col"
                style={{ background: cardBg, border: `1px solid ${border}` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-semibold text-white">Organization Velocity (Last 30h)</span>
                  <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>0 runs · 0% success</span>
                </div>
                <div className="flex-1 flex items-end gap-0.5 px-1">
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
                      <motion.div
                        className="w-full rounded-sm relative overflow-hidden"
                        style={{ background: 'rgba(255,170,0,0.12)' }}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.7, delay: 0.35 + i * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-sm"
                          style={{ background: accent }}
                        />
                      </motion.div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                    <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Runs volume</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Success ratio</span>
                  </div>
                </div>
              </motion.div>

              {/* Recent runs */}
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="col-span-2 rounded-xl p-2.5 flex flex-col"
                style={{ background: cardBg, border: `1px solid ${border}` }}
              >
                <span className="text-[9px] font-semibold text-white mb-2">Recent Test Runs</span>
                <div className="space-y-2 flex-1">
                  {recentRuns.map((run, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{run.name}</span>
                        <span className="text-[8px] font-bold" style={{ color: run.color }}>{run.pct}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: run.color }}
                          initial={{ width: 0 }}
                          animate={{ width: run.pct }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </div>
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
      className="relative min-h-screen flex items-center overflow-hidden pt-14 md:pt-0"
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
              className="font-bold leading-[1.1] tracking-tight mb-6 sm:mb-8"
              style={{
                fontFamily: "'Aeonik', sans-serif",
                fontWeight: 700,
                color: isDark ? '#ffffff' : c.textPrimary,
                fontSize: 'clamp(2.25rem, 7vw, 4.5rem)',
              }}
            >
              Ship faster
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
              your entire test suite in real-time, at scale, with zero scripting.
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

            {/* Integrations */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 flex flex-col items-center lg:items-start gap-3"
            >
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }}>
                Integrates with
              </p>
              <div className="flex items-center gap-3">
                {[
                  { name: 'GitHub', color: isDark ? '#ffffff' : '#24292e', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg> },
                  { name: 'GitLab', color: '#FC6D26', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 0 0-.867 0L1.386 9.45.044 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.625-8.443a.924.924 0 0 0 .33-1.024z" /></svg> },
                  { name: 'Jira', color: '#0052CC', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.13v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.022-1.005zM23.013 0H11.456a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" /></svg> },
                ].map((item) => (
                  <div
                    key={item.name}
                    title={item.name}
                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform hover:-translate-y-0.5 duration-200"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.07)',
                      boxShadow: isDark
                        ? '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
                        : '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                      color: item.color,
                    }}
                  >
                    {item.svg}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="lg:w-[62%] w-full"
            style={{ height: 'clamp(400px, 55vh, 600px)' }}
          >
            <HeroCanvas />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
