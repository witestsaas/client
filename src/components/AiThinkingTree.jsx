import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  FileText,
  Folder,
  Loader2,
  Search,
  Sparkles,
  XCircle,
  Zap,
  BookOpenText,
  Settings2,
  GitBranch,
  Lightbulb,
  Layers,
  Wrench,
} from "lucide-react";

// ─── Phase definitions: map event types to phases ──────────────────────────
const PHASE_DEFINITIONS = [
  {
    id: "init",
    label: "Initialization",
    icon: Zap,
    color: "blue",
    eventTypes: ["generation:started", "thinking:prompt-analysis"],
  },
  {
    id: "context",
    label: "Project Analysis",
    icon: Search,
    color: "violet",
    eventTypes: [
      "phase:analyzing",
      "phase:analyzed",
      "phase:checking",
      "phase:checked",
      "thinking:deduplication",
    ],
  },
  {
    id: "docs",
    label: "Documentation",
    icon: BookOpenText,
    color: "amber",
    eventTypes: [
      "phase:reading-docs",
      "phase:docs-loaded",
      "phase:no-docs",
      "thinking:url-extraction",
      "docs:updated",
    ],
  },
  {
    id: "planning",
    label: "AI Planning",
    icon: Brain,
    color: "purple",
    eventTypes: [
      "thinking:scenario-planning",
      "browser:analyzing",
      "browser:progress",
      "browser:analyzed",
      "thinking:agent-reasoning",
      "thinking:tool-call",
      "thinking:tool-result",
      "thinking:plan-ready",
      "thinking:structuring",
    ],
  },
  {
    id: "execution",
    label: "Test Generation",
    icon: Layers,
    color: "emerald",
    eventTypes: [
      "thinking:executing",
      "folder:found",
      "folder:created",
      "test:creating",
      "test:created",
      "test:updating",
      "test:updated",
      "test:error",
    ],
  },
  {
    id: "completion",
    label: "Completion",
    icon: Sparkles,
    color: "emerald",
    eventTypes: [
      "generation:completed",
      "generation:error",
      "generation:cancelled",
      "generation:retry",
    ],
  },
];

// Map event type → phase id
const EVENT_TO_PHASE = {};
PHASE_DEFINITIONS.forEach((phase) => {
  phase.eventTypes.forEach((et) => {
    EVENT_TO_PHASE[et] = phase.id;
  });
});

// ─── Helpers ───────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue: {
    dot: "bg-blue-500",
    line: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    glow: "shadow-blue-500/20",
    ring: "ring-blue-500/30",
    activeBg: "bg-blue-500/5",
  },
  violet: {
    dot: "bg-violet-500",
    line: "border-violet-500/30",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    glow: "shadow-violet-500/20",
    ring: "ring-violet-500/30",
    activeBg: "bg-violet-500/5",
  },
  amber: {
    dot: "bg-amber-500",
    line: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/20",
    ring: "ring-amber-500/30",
    activeBg: "bg-amber-500/5",
  },
  purple: {
    dot: "bg-purple-500",
    line: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    glow: "shadow-purple-500/20",
    ring: "ring-purple-500/30",
    activeBg: "bg-purple-500/5",
  },
  emerald: {
    dot: "bg-emerald-500",
    line: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-500/20",
    ring: "ring-emerald-500/30",
    activeBg: "bg-emerald-500/5",
  },
};

function getStepIcon(step) {
  const type = step.type || "";
  if (type.startsWith("folder:")) return Folder;
  if (type.startsWith("test:")) return FileText;
  if (type.startsWith("docs:") || type.includes("docs")) return BookOpenText;
  if (type.startsWith("thinking:tool-")) return Wrench;
  if (type.startsWith("thinking:")) return Lightbulb;
  if (type.startsWith("browser:")) return GitBranch;
  if (type.startsWith("phase:")) return Settings2;
  return Circle;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  try {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 1000) return "just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function computePhaseStatus(phaseSteps) {
  if (!phaseSteps.length) return "pending";
  if (phaseSteps.some((s) => s.status === "error")) return "error";
  if (phaseSteps.some((s) => s.status === "active")) return "active";
  if (phaseSteps.every((s) => s.status === "done")) return "done";
  return "active";
}

function computePhaseDuration(phaseSteps) {
  if (phaseSteps.length === 0) return null;
  const timestamps = phaseSteps
    .map((s) => s.timestamp)
    .filter(Boolean)
    .map((t) => new Date(t).getTime())
    .filter((t) => !isNaN(t));
  if (timestamps.length < 2) return null;
  const duration = Math.max(...timestamps) - Math.min(...timestamps);
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
}

// ─── Phase Status Indicator ────────────────────────────────────────────────
function PhaseStatusIndicator({ status, color }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  if (status === "active") {
    return (
      <span className={`relative flex h-3 w-3`}>
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-50`}
        />
        <span className={`relative inline-flex rounded-full h-3 w-3 ${colors.dot}`} />
      </span>
    );
  }
  if (status === "done") {
    return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
  }
  if (status === "error") {
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  }
  return (
    <span className="h-3 w-3 rounded-full border-2 border-[#232323]/20 dark:border-white/20" />
  );
}

// ─── Step Status Icon ──────────────────────────────────────────────────────
function StepStatusIcon({ status }) {
  if (status === "active") {
    return <Loader2 className="h-3 w-3 text-blue-500 animate-spin flex-shrink-0" />;
  }
  if (status === "done") {
    return <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />;
  }
  if (status === "error") {
    return <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />;
  }
  return <Circle className="h-3 w-3 text-[#232323]/25 dark:text-white/25 flex-shrink-0" />;
}

// ─── Phase Node Component ──────────────────────────────────────────────────
function PhaseNode({ phase, steps, isLast, isGenerating }) {
  const status = computePhaseStatus(steps);
  const duration = computePhaseDuration(steps);
  const colors = COLOR_MAP[phase.color] || COLOR_MAP.blue;
  const Icon = phase.icon;
  const isActive = status === "active";
  const [expanded, setExpanded] = useState(true);

  // Auto-expand active phases, auto-collapse completed ones after a delay
  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  if (steps.length === 0 && !isActive) return null;

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={`absolute left-[15px] top-[32px] bottom-0 w-0 border-l-2 border-dashed ${
            status === "done"
              ? "border-emerald-500/30"
              : status === "error"
                ? "border-red-500/20"
                : isActive
                  ? colors.line
                  : "border-[#232323]/10 dark:border-white/10"
          } transition-colors duration-500`}
        />
      )}

      {/* Phase Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-300 group text-left ${
          isActive
            ? `${colors.activeBg} ring-1 ${colors.ring}`
            : "hover:bg-[#232323]/[0.03] dark:hover:bg-white/[0.03]"
        }`}
      >
        {/* Phase dot */}
        <div className="flex-shrink-0 flex items-center justify-center w-[14px]">
          <PhaseStatusIndicator status={status} color={phase.color} />
        </div>

        {/* Phase icon */}
        <div
          className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md ${colors.badge} transition-all duration-300 ${
            isActive ? `shadow-md ${colors.glow}` : ""
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        {/* Label + duration */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-[13px] font-semibold ${
              status === "done"
                ? "text-[#232323]/70 dark:text-white/70"
                : isActive
                  ? "text-[#232323] dark:text-white"
                  : "text-[#232323]/40 dark:text-white/40"
            } transition-colors duration-300`}
          >
            {phase.label}
          </span>
        </div>

        {/* Duration badge */}
        {duration && status === "done" ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#232323]/5 dark:bg-white/5 text-[#232323]/50 dark:text-white/50">
            {duration}
          </span>
        ) : null}

        {/* Step count badge */}
        {steps.length > 0 ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#232323]/5 dark:bg-white/5 text-[#232323]/45 dark:text-white/45">
            {steps.length}
          </span>
        ) : null}

        {/* Expand/collapse chevron */}
        {steps.length > 0 ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-[#232323]/35 dark:text-white/35 flex-shrink-0 transition-transform" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[#232323]/35 dark:text-white/35 flex-shrink-0 transition-transform" />
          )
        ) : null}
      </button>

      {/* Phase Steps (children) */}
      {expanded && steps.length > 0 ? (
        <div className="ml-[15px] pl-5 border-l-2 border-dashed border-[#232323]/8 dark:border-white/8 mt-0.5 mb-1">
          {steps.map((step, idx) => {
            const StepIcon = getStepIcon(step);
            const isStepActive = step.status === "active";
            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-2 py-1.5 pl-2 pr-1 rounded-md transition-all duration-300 ${
                  isStepActive
                    ? "bg-blue-500/[0.04] dark:bg-blue-400/[0.04]"
                    : ""
                }`}
              >
                {/* Branch connector */}
                <div className="absolute -left-5 top-[14px] w-4 h-0 border-t border-dashed border-[#232323]/12 dark:border-white/12" />

                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <StepStatusIcon status={step.status} />
                </div>

                {/* Step icon */}
                <StepIcon
                  className={`h-3 w-3 mt-0.5 flex-shrink-0 ${
                    step.status === "done"
                      ? "text-[#232323]/40 dark:text-white/40"
                      : step.status === "active"
                        ? "text-blue-500"
                        : step.status === "error"
                          ? "text-red-400"
                          : "text-[#232323]/25 dark:text-white/25"
                  }`}
                />

                {/* Label + detail */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[12px] leading-tight ${
                      step.status === "active"
                        ? "text-[#232323] dark:text-white font-medium"
                        : step.status === "done"
                          ? "text-[#232323]/65 dark:text-white/65"
                          : step.status === "error"
                            ? "text-red-600 dark:text-red-400"
                            : "text-[#232323]/40 dark:text-white/40"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.detail ? (
                    <p className="text-[11px] text-[#232323]/45 dark:text-white/45 mt-0.5 leading-tight whitespace-pre-wrap">
                      {step.detail}
                    </p>
                  ) : null}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-[#232323]/30 dark:text-white/30 flex-shrink-0 mt-0.5 tabular-nums">
                  {formatRelativeTime(step.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ─── Main AiThinkingTree Component ─────────────────────────────────────────
export default function AiThinkingTree({ steps = [], phase = "generating" }) {
  const scrollRef = useRef(null);
  const isGenerating = phase === "generating";

  // Group steps into phases
  const phaseGroups = useMemo(() => {
    const groups = PHASE_DEFINITIONS.map((phaseDef) => ({
      phase: phaseDef,
      steps: [],
    }));

    const phaseMap = {};
    groups.forEach((g) => {
      phaseMap[g.phase.id] = g;
    });

    const uncategorized = [];
    for (const step of steps) {
      const phaseId = EVENT_TO_PHASE[step.type];
      if (phaseId && phaseMap[phaseId]) {
        phaseMap[phaseId].steps.push(step);
      } else {
        // Put in closest phase or planning as fallback
        uncategorized.push(step);
      }
    }

    // Put uncategorized steps in the planning phase
    if (uncategorized.length > 0 && phaseMap.planning) {
      phaseMap.planning.steps.push(...uncategorized);
    }

    // Filter out phases that have no steps and are not active
    return groups.filter((g) => g.steps.length > 0);
  }, [steps]);

  // Auto-scroll to bottom when new steps appear
  useEffect(() => {
    if (scrollRef.current && isGenerating) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps.length, isGenerating]);

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "done").length;
  const hasError = steps.some((s) => s.status === "error");

  if (totalSteps === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border bg-gradient-to-r from-[#232323]/[0.02] to-transparent dark:from-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Brain className="h-4 w-4 text-purple-500" />
            {isGenerating ? (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
            ) : null}
          </div>
          <span className="text-xs font-semibold text-[#232323]/70 dark:text-white/70 tracking-wide uppercase">
            AI Thinking Process
          </span>
          <div className="flex-1" />
          {/* Progress indicator */}
          {isGenerating ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing…
            </span>
          ) : hasError ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500">
              <XCircle className="h-3 w-3" />
              Error
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              Complete
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalSteps > 0 ? (
          <div className="mt-2 h-1 rounded-full bg-[#232323]/5 dark:bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                hasError
                  ? "bg-red-500"
                  : isGenerating
                    ? "bg-gradient-to-r from-purple-500 to-blue-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}%`,
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Tree Content */}
      <div ref={scrollRef} className="max-h-[400px] overflow-auto px-3 py-2 space-y-0.5">
        {phaseGroups.map((group, index) => (
          <PhaseNode
            key={group.phase.id}
            phase={group.phase}
            steps={group.steps}
            isLast={index === phaseGroups.length - 1}
            isGenerating={isGenerating}
          />
        ))}
      </div>
    </div>
  );
}
