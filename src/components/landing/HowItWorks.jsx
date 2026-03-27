import React from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useInView,
} from 'framer-motion';
import Section from './ui/Section';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';
import {
  Brain,
  ListChecks,
  Zap,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
  Globe,
  Cpu,
  LineChart,
  AlertTriangle,
  Lightbulb,
  Layers,
  ChevronRight,
} from 'lucide-react';

/* ── Floating particles component ──────────────────────────────── */
function FloatingParticles({ color, count = 6 }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: color,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20 - Math.random() * 30, 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1 + Math.random(), 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated progress ring ─────────────────────────────────────── */
function ProgressRing({ progress, color, size = 44, strokeWidth = 3 }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`${color}15`}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
      />
    </svg>
  );
}

/* ── Typing text effect ─────────────────────────────────────────── */
function TypingText({ text, color, delay = 0 }) {
  const [displayed, setDisplayed] = React.useState('');
  React.useEffect(() => {
    setDisplayed('');
    const timeout = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(iv);
      }, 28);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return (
    <span style={{ color }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ color }}
      >
        |
      </motion.span>
    </span>
  );
}

/* ── Pulse dot ─────────────────────────────────────────────────── */
function PulseDot({ color, size = 8 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}

/* ── Scene-specific immersive visuals ──────────────────────────── */

function Scene01Generate({ c, accent, isDark }) {
  const items = [
    { icon: Shield, label: 'Login flow — 8 edge cases', pct: 100, delay: 0 },
    { icon: Globe, label: 'Checkout path — multi-currency', pct: 87, delay: 0.15 },
    { icon: Layers, label: 'Role permissions — RBAC matrix', pct: 92, delay: 0.3 },
    { icon: AlertTriangle, label: 'Error fallbacks — network + 5xx', pct: 75, delay: 0.45 },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* AI thinking bar */}
      <motion.div
        className="rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border relative overflow-hidden"
        style={{ borderColor: `${accent}25`, background: `${accent}06` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-5 h-5" style={{ color: accent }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: accent }}>
              AI Agent Analyzing
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${accent}15` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono shrink-0" style={{ color: `${accent}aa` }}>
            <TypingText text="34 scenarios found" color={`${accent}cc`} delay={1200} />
          </span>
        </div>
        <FloatingParticles color={accent} count={4} />
      </motion.div>

      {/* Generated items */}
      <div className="flex-1 space-y-2 sm:space-y-2.5 overflow-y-auto">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, delay: item.delay + 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3 group border"
            style={{
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
              borderColor: `${accent}15`,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${accent}12` }}
            >
              <item.icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: c.textPrimary }}>
                {item.label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: `${accent}12` }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accent }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: item.delay + 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: `${accent}99` }}>
                  {item.pct}%
                </span>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: item.delay + 1.5, type: 'spring', stiffness: 400 }}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: accent }} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Bottom summary */}
      <motion.div
        className="mt-3 sm:mt-4 rounded-lg px-3 py-2 flex items-center justify-between"
        style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.4 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-xs font-medium" style={{ color: accent }}>
            34 test cases generated
          </span>
        </div>
        <span className="text-[10px]" style={{ color: c.textMuted }}>
          4 modules covered
        </span>
      </motion.div>
    </div>
  );
}

function Scene02Plan({ c, accent, isDark }) {
  const environments = [
    { name: 'Chrome Desktop', icon: '🖥️', tests: 12, status: 'ready' },
    { name: 'Firefox macOS', icon: '🦊', tests: 12, status: 'ready' },
    { name: 'Safari Mobile', icon: '📱', tests: 8, status: 'ready' },
    { name: 'Edge Windows', icon: '🪟', tests: 12, status: 'ready' },
  ];
  const policies = [
    { label: 'Retry on failure', value: '2x exponential' },
    { label: 'Parallel sessions', value: '4 concurrent' },
    { label: 'Timeout per test', value: '120 seconds' },
    { label: 'Release gate', value: '95% pass rate' },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* Environment matrix */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
        {environments.map((env, i) => (
          <motion.div
            key={env.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 + 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl p-3 border relative overflow-hidden"
            style={{
              borderColor: `${accent}20`,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{env.icon}</span>
              <span className="text-xs font-semibold truncate" style={{ color: c.textPrimary }}>
                {env.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: c.textMuted }}>
                {env.tests} tests
              </span>
              <motion.span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ color: accent, background: `${accent}12` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.6 }}
              >
                Ready
              </motion.span>
            </div>
            {/* Connecting line animation */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px]"
              style={{ background: accent }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, delay: i * 0.1 + 0.5, ease: 'easeOut' }}
            />
          </motion.div>
        ))}
      </div>

      {/* Execution policies */}
      <motion.div
        className="rounded-xl border p-3 sm:p-4 flex-1"
        style={{ borderColor: `${accent}15`, background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4" style={{ color: accent }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
            Execution Config
          </span>
        </div>
        <div className="space-y-2">
          {policies.map((p, i) => (
            <motion.div
              key={p.label}
              className="flex items-center justify-between py-1.5 border-b last:border-0"
              style={{ borderColor: `${accent}10` }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + i * 0.08 }}
            >
              <span className="text-xs" style={{ color: c.textMuted }}>{p.label}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: c.textPrimary }}>{p.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        className="mt-3 sm:mt-4 rounded-lg px-3 py-2.5 flex items-center justify-between"
        style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-xs font-semibold" style={{ color: accent }}>
            44 tests across 4 environments
          </span>
        </div>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight className="w-3.5 h-3.5" style={{ color: accent }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function Scene03Execute({ c, accent, isDark }) {
  const agents = [
    { name: 'Chrome Desktop', progress: 1, passed: 12, total: 12, live: false },
    { name: 'Firefox macOS', progress: 1, passed: 11, total: 12, live: false },
    { name: 'Safari Mobile', progress: 0.65, passed: 5, total: 8, live: true },
    { name: 'Edge Windows', progress: 0.85, passed: 10, total: 12, live: true },
  ];
  const logLines = [
    { time: '12:04:01', msg: 'Agent-1 → Login flow passed (1.2s)', type: 'pass' },
    { time: '12:04:03', msg: 'Agent-3 → Mobile viewport captured', type: 'info' },
    { time: '12:04:05', msg: 'Agent-2 → Checkout multi-currency passed', type: 'pass' },
    { time: '12:04:06', msg: 'Agent-4 → Screenshot saved → S3', type: 'info' },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* Live header */}
      <motion.div
        className="rounded-xl p-3 mb-3 sm:mb-4 flex items-center justify-between"
        style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2.5">
          <PulseDot color={accent} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
            Live Execution
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono" style={{ color: c.textMuted }}>38/44 passed</span>
          <ProgressRing progress={38 / 44} color={accent} size={28} strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Agent lanes */}
      <div className="space-y-2 mb-3 sm:mb-4">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.12 + 0.3 }}
            className="rounded-lg px-3 py-2.5 border"
            style={{
              borderColor: agent.live ? `${accent}30` : `${accent}12`,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {agent.live ? (
                  <PulseDot color={accent} size={6} />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accent }} />
                )}
                <span className="text-xs font-medium" style={{ color: c.textPrimary }}>
                  {agent.name}
                </span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: agent.live ? accent : c.textMuted }}>
                {agent.passed}/{agent.total}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: `${accent}12` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: agent.progress === 1 ? accent : `${accent}cc` }}
                initial={{ width: '0%' }}
                animate={{ width: `${agent.progress * 100}%` }}
                transition={{
                  duration: agent.live ? 3 : 1.2,
                  delay: i * 0.12 + 0.5,
                  ease: agent.live ? 'linear' : 'easeOut',
                  ...(agent.live ? { repeat: Infinity, repeatType: 'reverse' } : {}),
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live log feed */}
      <motion.div
        className="rounded-xl border p-2.5 sm:p-3 flex-1 overflow-hidden font-mono"
        style={{
          borderColor: `${accent}15`,
          background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="space-y-1.5">
          {logLines.map((line, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-2 text-[10px] sm:text-[11px] leading-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.35, duration: 0.3 }}
            >
              <span style={{ color: c.textMuted }} className="shrink-0">{line.time}</span>
              <span style={{ color: line.type === 'pass' ? accent : c.textSubtle }}>{line.msg}</span>
            </motion.div>
          ))}
          <motion.div
            className="flex items-center gap-1 text-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 2.8, duration: 1.5, repeat: Infinity }}
          >
            <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: accent }} />
            <span style={{ color: `${accent}88` }}>streaming...</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function Scene04Insights({ c, accent, isDark }) {
  const insights = [
    {
      icon: AlertTriangle,
      title: '2 flaky tests detected',
      desc: 'Login timeout intermittent on Safari — network latency correlation found',
      severity: 'warning',
    },
    {
      icon: Lightbulb,
      title: 'Suggested fix',
      desc: 'Add explicit wait for auth token before redirect assertion',
      severity: 'fix',
    },
    {
      icon: LineChart,
      title: 'Trend: checkout improved 12%',
      desc: 'Cart abandonment path now 340ms faster after last deploy',
      severity: 'positive',
    },
  ];
  const metrics = [
    { label: 'Pass rate', value: '95.4%', delta: '+2.1%' },
    { label: 'Avg duration', value: '1.8s', delta: '-0.4s' },
    { label: 'Coverage', value: '89%', delta: '+5%' },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* Metrics ribbon */}
      <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="rounded-xl p-2.5 sm:p-3 border text-center"
            style={{
              borderColor: `${accent}15`,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
          >
            <p className="text-lg sm:text-xl font-bold" style={{ color: c.textPrimary }}>
              {m.value}
            </p>
            <p className="text-[10px] mb-0.5" style={{ color: c.textMuted }}>{m.label}</p>
            <motion.span
              className="text-[10px] font-semibold"
              style={{ color: accent }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.6 }}
            >
              {m.delta}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* AI insight cards */}
      <div className="flex-1 space-y-2 sm:space-y-2.5 overflow-y-auto">
        {insights.map((ins, i) => (
          <motion.div
            key={ins.title}
            initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, delay: 0.7 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl p-3 sm:p-4 border relative overflow-hidden group"
            style={{
              borderColor: `${accent}15`,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
            }}
          >
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${accent}12` }}
              >
                <ins.icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold mb-0.5" style={{ color: c.textPrimary }}>
                  {ins.title}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: c.textMuted }}>
                  {ins.desc}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 self-center" style={{ color: `${accent}44` }} />
            </div>
            {/* Subtle shimmer on hover */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `linear-gradient(105deg, transparent 40%, ${accent}08 50%, transparent 60%)`,
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </div>

      {/* AI summary */}
      <motion.div
        className="mt-3 sm:mt-4 rounded-xl p-3 sm:p-4 relative overflow-hidden"
        style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.4 }}
      >
        <div className="flex items-start gap-2.5">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
          </motion.div>
          <p className="text-[11px] leading-relaxed" style={{ color: c.textPrimary }}>
            <TypingText
              text="Your test suite is healthy. 2 flaky tests need attention — fix suggested above. Coverage increased to 89% after adding error fallback tests."
              color={c.textPrimary}
              delay={2000}
            />
          </p>
        </div>
        <FloatingParticles color={accent} count={3} />
      </motion.div>
    </div>
  );
}

/* ── Scene data ────────────────────────────────────────────────── */
const demoScenes = [
  {
    id: 'test-cases',
    step: '01',
    title: 'AI generates test cases',
    desc: 'The agent explores your app and auto-generates comprehensive test scenarios with full coverage.',
    accent: '#ffb733',
    icon: Brain,
    tags: ['Coverage map', 'Edge scenarios', 'Persona paths'],
    Scene: Scene01Generate,
  },
  {
    id: 'create-plan',
    step: '02',
    title: 'Build an execution plan',
    desc: 'Bundle cases into smart plans with browser targets, retries, and release gates.',
    accent: '#60a5fa',
    icon: ListChecks,
    tags: ['Multi-environment', 'Risk scoring', 'Parallel-ready'],
    Scene: Scene02Plan,
  },
  {
    id: 'test-run',
    step: '03',
    title: 'Execute with live signals',
    desc: 'Runs dispatch across agents in real-time with traces, screenshots, and logs.',
    accent: '#22c55e',
    icon: Zap,
    tags: ['Live stream', 'Parallel agents', 'Auto evidence'],
    Scene: Scene03Execute,
  },
  {
    id: 'assistant',
    step: '04',
    title: 'Get AI-powered insights',
    desc: 'AI summarises failures, detects flaky patterns, and suggests actionable fixes instantly.',
    accent: '#a855f7',
    icon: BarChart3,
    tags: ['Root cause', 'Flaky detector', 'Suggested fixes'],
    Scene: Scene04Insights,
  },
];

/* ── Main component ────────────────────────────────────────────── */
export default function HowItWorks() {
  const containerRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.4 });

  useMotionValueEvent(smooth, 'change', (v) => {
    const idx = Math.min(demoScenes.length - 1, Math.max(0, Math.floor(v * demoScenes.length)));
    setActiveIndex((cur) => (cur === idx ? cur : idx));
  });

  const scene = demoScenes[activeIndex];
  const SceneComponent = scene.Scene;

  return (
    <Section
      id="how-it-works"
      className="px-4 sm:px-6 pt-16 sm:pt-28 pb-8"
      style={{ background: c.sectionBg2 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <motion.p
            className="font-semibold text-xs uppercase tracking-[0.2em] mb-4"
            style={{ color: '#ffb733' }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How it works
          </motion.p>
          <motion.h2
            className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4"
            style={{ color: c.textPrimary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Four steps to full coverage
          </motion.h2>
          <motion.p
            className="text-base max-w-xl mx-auto"
            style={{ color: c.textMuted }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            From test generation to actionable insights — scroll to explore each stage.
          </motion.p>
        </div>

        <div ref={containerRef} className="relative h-[260vh] sm:h-[300vh] lg:h-[340vh]">
          <div className="sticky top-16 sm:top-20 lg:top-24 h-[80vh] sm:h-[78vh]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 h-full items-stretch">
              {/* Step indicators — enhanced with icons, connector line, glow */}
              <div className="lg:col-span-4 flex lg:flex-col gap-2 sm:gap-0 self-center overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 relative lg:pl-4">
                {/* Vertical connector line (desktop only) */}
                <div
                  className="hidden lg:block absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
                  style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                >
                  <motion.div
                    className="w-full rounded-full"
                    style={{ background: scene.accent }}
                    animate={{ height: `${((activeIndex + 1) / demoScenes.length) * 100}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                {demoScenes.map((s, i) => {
                  const active = i === activeIndex;
                  const done = i < activeIndex;
                  const IconEl = s.icon;
                  return (
                    <motion.div
                      key={s.id}
                      animate={{
                        opacity: active ? 1 : done ? 0.7 : 0.35,
                        x: active ? 0 : -4,
                      }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-xl p-3 sm:p-4 border transition-colors duration-300 min-w-[160px] lg:min-w-0 shrink-0 lg:shrink relative"
                      style={{
                        borderColor: active ? `${s.accent}55` : done ? `${s.accent}25` : c.borderSm,
                        background: active ? `${s.accent}08` : 'transparent',
                        boxShadow: active ? `0 0 24px ${s.accent}15` : 'none',
                      }}
                    >
                      {/* Glow backdrop */}
                      {active && (
                        <motion.div
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{
                            background: `radial-gradient(ellipse at 30% 50%, ${s.accent}10, transparent 70%)`,
                          }}
                          layoutId="stepGlow"
                          transition={{ duration: 0.5 }}
                        />
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className="w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 relative"
                          style={{
                            background: active ? `${s.accent}18` : done ? `${s.accent}10` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                            border: `1.5px solid ${active ? s.accent : done ? `${s.accent}40` : 'transparent'}`,
                          }}
                        >
                          {done ? (
                            <CheckCircle2 className="w-5 h-5" style={{ color: s.accent }} />
                          ) : active ? (
                            <motion.div
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <IconEl className="w-5 h-5" style={{ color: s.accent }} />
                            </motion.div>
                          ) : (
                            <IconEl className="w-5 h-5" style={{ color: c.textSubtle }} />
                          )}
                        </div>
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-[0.15em] mb-0.5 font-bold"
                            style={{ color: active ? s.accent : c.textSubtle }}
                          >
                            Step {s.step}
                          </p>
                          <h3
                            className="text-sm font-semibold leading-tight"
                            style={{ color: active || done ? c.textPrimary : c.textMuted }}
                          >
                            {s.title}
                          </h3>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Demo canvas — enhanced with gradient border, background effects */}
              <div className="lg:col-span-8 h-full min-h-[300px] sm:min-h-[400px]">
                <motion.div
                  className="rounded-2xl h-full border overflow-hidden relative"
                  style={{
                    borderColor: `${scene.accent}33`,
                    background: c.mockupBg,
                    boxShadow: isDark
                      ? `0 30px 80px rgba(0,0,0,0.4), 0 0 60px ${scene.accent}08`
                      : `0 30px 80px rgba(0,0,0,0.08), 0 0 60px ${scene.accent}06`,
                  }}
                  animate={{
                    boxShadow: isDark
                      ? `0 30px 80px rgba(0,0,0,0.4), 0 0 60px ${scene.accent}12`
                      : `0 30px 80px rgba(0,0,0,0.08), 0 0 60px ${scene.accent}08`,
                  }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Subtle gradient accent at top */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${scene.accent}, transparent)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Browser bar */}
                  <div
                    className="h-10 px-4 flex items-center gap-2"
                    style={{ background: c.mockupBarBg, borderBottom: `1px solid ${c.mockupBorder}` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <div
                      className="flex-1 max-w-[260px] ml-3 rounded-md px-3 py-1 flex items-center gap-2"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: `${scene.accent}30` }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: `${scene.accent}`, transform: 'scale(0.5)' }} />
                      </div>
                      <span className="text-[11px] font-mono" style={{ color: c.mockupUrlText }}>
                        app.qalion.io
                      </span>
                    </div>
                  </div>

                  {/* Scene content with header + immersive component */}
                  <div className="pt-4 sm:pt-5 px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 h-[calc(100%-2.5rem)] flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={scene.id}
                        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full flex flex-col"
                      >
                        {/* Header area */}
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded-md"
                                style={{ color: scene.accent, background: `${scene.accent}12` }}
                              >
                                Step {scene.step}
                              </span>
                              <div className="flex gap-1">
                                {scene.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded-md hidden sm:inline-block"
                                    style={{
                                      color: `${scene.accent}cc`,
                                      background: `${scene.accent}08`,
                                      border: `1px solid ${scene.accent}15`,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <h3
                              className="text-base sm:text-lg md:text-xl font-bold mb-0.5"
                              style={{ color: c.textPrimary }}
                            >
                              {scene.title}
                            </h3>
                            <p className="text-[11px] sm:text-xs max-w-md" style={{ color: c.textMuted }}>
                              {scene.desc}
                            </p>
                          </div>
                        </div>

                        {/* Immersive scene content */}
                        <div className="flex-1 min-h-0">
                          <SceneComponent c={c} accent={scene.accent} isDark={isDark} />
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
