import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, Zap,
  BarChart3, ClipboardList, Layers, Play,
  Bot, Activity, Users, FolderOpen,
} from 'lucide-react';
import { getLandingColors } from '../../utils/theme-colors';
import logoYellow from '../../assets/logo_yellow.svg';

/* ─── Taille de design interne (fixe) ───────────────────────────── */
const DW = 860;  // design width
const DH = 520;  // design height
const SB = 180;  // sidebar width
const TB = 48;   // topbar height
const PD = 16;   // inner padding
const CH = 180;  // chart height

/* ─── Dashboard mockup ───────────────────────────────────────────── */
function HeroCanvas() {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setScale(containerRef.current.offsetWidth / DW);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const accent    = '#FFAA00';
  const bg        = '#13112a';
  const sidebarBg = '#1c1a2e';
  const cardBg    = '#1e1c32';
  const border    = 'rgba(255,255,255,0.07)';

  const navItems = [
    { label: 'Dashboard',  icon: BarChart3,    active: true },
    { label: 'Test Cases', icon: ClipboardList },
    { label: 'Test Plans', icon: Layers },
    { label: 'Test Runs',  icon: Play },
    { label: 'Reports',    icon: BarChart3 },
  ];

  const analysisItems = [
    { label: 'Insights', icon: Bot },
    { label: 'Coverage', icon: Activity },
  ];

  const statCards = [
    { label: 'PROJECTS',     value: '12',  color: '#F29F05', bg: '#F29F0520' },
    { label: 'TEST CASES',   value: '248', color: '#3b82f6', bg: '#3b82f620' },
    { label: 'SUCCESS RATE', value: '94%', color: '#22c55e', bg: '#22c55e20' },
    { label: 'FAILURES',     value: '17',  color: '#ef4444', bg: '#ef444420' },
  ];

  const INIT_BARS = [30, 52, 42, 68, 58, 78, 62, 74, 56, 70];
  const [bars, setBars] = useState(INIT_BARS);
  useEffect(() => {
    const id = setInterval(() => {
      setBars(prev => prev.map(h =>
        Math.max(12, Math.min(92, h + Math.round((Math.random() - 0.5) * 34))),
      ));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const recentRuns = [
    { name: 'E2E Suite',  pct: '94%',  color: '#22c55e' },
    { name: 'API Tests',  pct: '67%',  color: accent },
    { name: 'Unit Tests', pct: '100%', color: '#22c55e' },
  ];

  const contentH = DH - TB;

  return (
    /* Conteneur responsive : prend 100% de la largeur dispo, hauteur calculée depuis scale */
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: DH * scale,
        position: 'relative',
        borderRadius: 16 * scale,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 60px rgba(255,170,0,0.06)',
      }}
    >
      {/* Dashboard interne en taille de design, réduit par scale */}
      <div style={{
        width: DW,
        height: DH,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: 0,
        left: 0,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
      }}>
        {/* Ligne d'accent en haut */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1, zIndex: 10,
          background: 'linear-gradient(90deg,transparent,rgba(255,170,0,0.5),transparent)',
        }} />

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div style={{
          width: SB, flexShrink: 0, height: DH,
          background: sidebarBg, borderRight: `1px solid ${border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}` }}>
            <img src={logoYellow} alt="Qalion" style={{ height: 24, width: 'auto' }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>QALION</span>
          </div>

          {/* Org switcher */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${border}` }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, color: 'rgba(255,255,255,0.28)' }}>Organization</p>
            <div style={{ borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}` }}>
              <span style={{ fontSize: 11, color: '#fff' }}>Wirky Group</span>
              <ChevronDown style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
            {navItems.map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '6px 10px',
                background: item.active ? accent : 'transparent',
              }}>
                <item.icon style={{ width: 13, height: 13, flexShrink: 0, color: item.active ? '#1a1826' : 'rgba(255,255,255,0.35)' }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: item.active ? '#1a1826' : 'rgba(255,255,255,0.5)' }}>{item.label}</span>
              </div>
            ))}

            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 10px 4px', color: 'rgba(255,255,255,0.22)' }}>Analysis</p>
            {analysisItems.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '6px 10px' }}>
                <item.icon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
              </div>
            ))}

            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 10px 4px', color: 'rgba(255,255,255,0.22)' }}>Platform</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '6px 10px' }}>
              <Users style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Organizations</span>
            </div>
          </nav>
        </div>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: DH }}>

          {/* Top bar */}
          <div style={{
            height: TB, flexShrink: 0, padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}` }}>
              <FolderOpen style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.35)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Select Project</span>
              <ChevronDown style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.25)' }} />
            </div>
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: 700, background: accent, color: '#1a1826' }}
              animate={{ boxShadow: [`0 0 0px ${accent}00`, `0 0 14px ${accent}66`, `0 0 0px ${accent}00`] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap style={{ width: 12, height: 12 }} />
              Quick Run
            </motion.div>
          </div>

          {/* Page content */}
          <div style={{ height: contentH, padding: PD, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>

            {/* Title row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1, margin: 0 }}>Dashboard</h3>
                <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.38)' }}>Overview of your testing suite performance.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, background: accent, color: '#1a1826' }}>Open Projects</div>
                <div style={{ borderRadius: 8, padding: '5px 12px', fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: `1px solid ${border}` }}>Team Access</div>
              </div>
            </motion.div>

            {/* Stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, flexShrink: 0 }}
            >
              {statCards.map(s => (
                <div key={s.label} style={{ borderRadius: 12, padding: 14, background: cardBg, border: `1px solid ${border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, background: s.bg }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Bottom panels */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 10, minHeight: 0 }}>

              {/* Velocity chart */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                style={{ borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, background: cardBg, border: `1px solid ${border}`, overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Organization Velocity (Last 30h)</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {bars.length} runs · {Math.round(bars.reduce((a, b) => a + b, 0) / bars.length)}% avg
                  </span>
                </div>

                <div style={{ position: 'relative', height: CH, flexShrink: 0 }}>
                  {[33, 66].map(pct => (
                    <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
                  ))}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 2px' }}>
                    {bars.map((h, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: CH }}>
                        <motion.div
                          style={{ width: '100%', borderRadius: 4, background: `linear-gradient(to top, ${accent}, ${accent}88)`, position: 'relative', overflow: 'hidden' }}
                          initial={{ height: 0 }}
                          animate={{ height: Math.round(h * CH / 100) }}
                          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: accent, boxShadow: `0 0 8px ${accent}90` }} />
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  {[{ label: 'Runs volume', color: accent }, { label: 'Success ratio', color: '#22c55e' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent runs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
                style={{ borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 14, background: cardBg, border: `1px solid ${border}`, overflow: 'hidden' }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>Recent Test Runs</span>
                {recentRuns.map((run, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{run.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: run.color }}>{run.pct}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div
                        style={{ height: 5, borderRadius: 9999, background: run.color }}
                        initial={{ width: 0 }}
                        animate={{ width: run.pct }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero section ───────────────────────────────────────────────── */
export default function Hero() {
  const isDark = true;
  const c = getLandingColors(isDark);

  return (
    <section
      className="relative overflow-hidden pt-24 pb-14 lg:min-h-screen lg:flex lg:items-center lg:pt-0 lg:pb-0"
      style={{ background: 'transparent' }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16">
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
                fontSize: 'clamp(1.9rem, 6vw, 4.5rem)',
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
                  className="inline-flex items-center gap-2 font-semibold px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base transition-colors duration-200 cursor-pointer"
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
            className="w-full lg:w-[62%]"
          >
            <HeroCanvas />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
