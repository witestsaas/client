import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import Section from './ui/Section';
import { useTheme } from '../../utils/theme-context.tsx';
import { getLandingColors } from '../../utils/theme-colors';

const demoScenes = [
  {
    id: 'test-cases',
    eyebrow: '01 · Generate test cases',
    title: 'AI maps your product and writes complete test cases',
    desc: 'The agent explores pages, actions, and edge paths to generate high-quality cases with coverage focus.',
    accent: '#ffb733',
    tags: ['Coverage map', 'Persona paths', 'Edge scenarios'],
    rows: [
      { label: 'Login flow', status: 'Generated' },
      { label: 'Checkout path', status: 'Generated' },
      { label: 'Role permissions', status: 'Generated' },
      { label: 'Error fallback', status: 'Generated' },
    ],
  },
  {
    id: 'create-plan',
    eyebrow: '02 · Create execution plan',
    title: 'Build an execution plan in seconds',
    desc: 'Bundle generated cases into smart plans with browser targets, retries, and release gates.',
    accent: '#60a5fa',
    tags: ['Staging + Production', 'Risk score', 'Parallel-ready'],
    rows: [
      { label: 'Suite selection', status: 'Done' },
      { label: 'Environment matrix', status: 'Done' },
      { label: 'Retry policy', status: 'Done' },
      { label: 'Release guardrail', status: 'Done' },
    ],
  },
  {
    id: 'test-run',
    eyebrow: '03 · Launch test run',
    title: 'Execute runs with live signals and artifacts',
    desc: 'Runs are dispatched across agents and streamed in real-time with traces, screenshots, and logs.',
    accent: '#22c55e',
    tags: ['Live stream', 'Parallel agents', 'Auto evidence'],
    rows: [
      { label: 'Chrome run', status: 'Passed' },
      { label: 'Firefox run', status: 'Passed' },
      { label: 'Mobile viewport', status: 'Running' },
      { label: 'API contract', status: 'Passed' },
    ],
  },
  {
    id: 'assistant',
    eyebrow: '04 · AI assistant insights',
    title: 'Ask the assistant and get actionable fixes',
    desc: 'Assistant AI summarizes failures, highlights flaky patterns, and suggests next actions instantly.',
    accent: '#a855f7',
    tags: ['Root cause hints', 'Flaky detector', 'Suggested fixes'],
    rows: [
      { label: 'Failure summary', status: 'Ready' },
      { label: 'Top risk module', status: 'Payments' },
      { label: 'Fix suggestion', status: '2 options' },
      { label: 'Retest checklist', status: 'Prepared' },
    ],
  },
];

export default function HowItWorks() {
  const containerRef = React.useRef(null);
  const [activeSceneIndex, setActiveSceneIndex] = React.useState(0);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getLandingColors(isDark);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.4,
  });

  useMotionValueEvent(smoothProgress, 'change', (value) => {
    const sceneIndex = Math.min(
      demoScenes.length - 1,
      Math.max(0, Math.floor(value * demoScenes.length))
    );
    setActiveSceneIndex((current) => (current === sceneIndex ? current : sceneIndex));
  });

  const activeScene = demoScenes[activeSceneIndex];

  return (
    <Section id="how-it-works" className="px-6 pt-28 pb-8 relative overflow-hidden"
      style={{ background: c.sectionBg2 }}>
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className={isDark ? 'opacity-[0.025]' : 'opacity-[0.04]'}>
          <defs>
            <pattern id="grid2" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none"
                stroke={isDark ? 'white' : 'black'} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p className="text-[#ffb733] font-bold text-xs uppercase tracking-[0.25em] mb-3">How it works</motion.p>
          <motion.h2 className="text-4xl md:text-5xl font-bold dark:text-white text-gray-900 mb-4">
            Scroll the flow,<br />watch each stage come alive
          </motion.h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: c.textMuted }}>
            From test-case generation to assistant insights, each scroll step reveals a new live demo canvas.
          </p>
        </div>

        <div ref={containerRef} className="relative h-[340vh]">
          <div className="sticky top-24 h-[78vh]">
            <div className="grid lg:grid-cols-12 gap-8 h-full items-stretch">
              <div className="lg:col-span-4 space-y-3 self-center">
                {demoScenes.map((scene, index) => {
                  const isActive = index === activeSceneIndex;
                  return (
                    <motion.div
                      key={scene.id}
                      animate={{
                        opacity: isActive ? 1 : 0.5,
                        x: isActive ? 0 : -8,
                        scale: isActive ? 1 : 0.98,
                      }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="rounded-xl p-4 border"
                      style={{
                        borderColor: isActive ? `${scene.accent}66` : c.borderSm,
                        background: isActive ? `${scene.accent}12` : c.cardBg,
                        boxShadow: isActive ? `0 0 40px ${scene.accent}1f` : 'none',
                      }}>
                      <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: isActive ? scene.accent : c.textSubtle }}>{scene.eyebrow}</p>
                      <h3 className="text-sm md:text-base font-semibold dark:text-white text-gray-900">{scene.title}</h3>
                    </motion.div>
                  );
                })}
              </div>

              <div className="lg:col-span-8 h-full">
                <motion.div
                  className="rounded-2xl h-full border overflow-hidden relative"
                  style={{
                    borderColor: `${activeScene.accent}55`,
                    background: c.mockupBg,
                    boxShadow: isDark
                      ? `0 40px 90px rgba(0,0,0,0.55), 0 0 120px ${activeScene.accent}20`
                      : `0 36px 80px rgba(0,0,0,0.14), 0 0 100px ${activeScene.accent}16`,
                  }}>
                  <div className="absolute top-0 left-0 right-0 h-12 px-4 flex items-center gap-2"
                    style={{ background: c.mockupBarBg, borderBottom: `1px solid ${c.mockupBorder}` }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <span className="text-xs ml-2 font-mono" style={{ color: c.mockupUrlText }}>live-demo.qalion.ai/flow</span>
                  </div>

                  <div className="pt-16 px-5 md:px-8 pb-6 h-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScene.id}
                        initial={{ opacity: 0, y: 22, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -18, filter: 'blur(3px)' }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full flex flex-col">
                        <p className="text-xs uppercase tracking-[0.22em] mb-2" style={{ color: activeScene.accent }}>{activeScene.eyebrow}</p>
                        <h3 className="text-xl md:text-2xl font-bold dark:text-white text-gray-900 mb-2">{activeScene.title}</h3>
                        <p className="text-sm md:text-base mb-5" style={{ color: c.textMuted }}>{activeScene.desc}</p>

                        <div className="flex flex-wrap gap-2 mb-5">
                          {activeScene.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-3 py-1 rounded-full border"
                              style={{ borderColor: `${activeScene.accent}4d`, background: `${activeScene.accent}14`, color: activeScene.accent }}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="rounded-xl border p-3 md:p-4 flex-1"
                          style={{ borderColor: c.mockupPanelBorder, background: c.mockupPanelBg }}>
                          <div className="space-y-3">
                            {activeScene.rows.map((row, rowIndex) => (
                              <motion.div
                                key={row.label}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: rowIndex * 0.08 }}
                                className="rounded-lg px-3 py-2.5 flex items-center justify-between"
                                style={{
                                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
                                  border: `1px solid ${c.borderSm}`,
                                }}>
                                <span className="text-sm font-medium" style={{ color: c.textPrimary }}>{row.label}</span>
                                <motion.span
                                  className="text-xs px-2 py-1 rounded-md border"
                                  style={{
                                    color: activeScene.accent,
                                    borderColor: `${activeScene.accent}55`,
                                    background: `${activeScene.accent}14`,
                                  }}
                                  animate={{ boxShadow: [`0 0 0px ${activeScene.accent}00`, `0 0 14px ${activeScene.accent}25`, `0 0 0px ${activeScene.accent}00`] }}
                                  transition={{ duration: 2.2, repeat: Infinity, delay: rowIndex * 0.2 }}>
                                  {row.status}
                                </motion.span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      background: `radial-gradient(circle at 80% 20%, ${activeScene.accent}22 0%, transparent 45%)`,
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
