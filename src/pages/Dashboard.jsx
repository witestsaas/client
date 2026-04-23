import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  FileText,
  Folder,
  FolderPlus,
  Loader2,
  PlayCircle,
  Plus,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchProjectTree, fetchTestProjects } from "../services/testManagement";
import { listPlans, listRuns } from "../services/executionReporting";
import { useLanguage } from "../utils/language-context";

function formatTimeAgo(dateString, t) {
  if (!dateString || dateString === "-") return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return t("dashboard.time.justNow");
  if (diffMin < 60) return `${diffMin}${t("dashboard.time.mAgo")}`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}${t("dashboard.time.hAgo")}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}${t("dashboard.time.dAgo")}`;
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase();
}

function isRunSuccess(status) {
  const normalized = normalizeStatus(status);
  return normalized === "completed" || normalized === "passed" || normalized === "success";
}

function isRunFailure(status) {
  const normalized = normalizeStatus(status);
  return normalized === "failed" || normalized === "error" || normalized === "cancelled";
}

function isRunActive(status) {
  const normalized = normalizeStatus(status);
  return normalized === "running" || normalized === "queued" || normalized === "pending" || normalized === "inprogress";
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusBadgeClass(status) {
  if (isRunSuccess(status)) {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }
  if (isRunFailure(status)) {
    return "bg-red-500/15 text-red-700 dark:text-red-300";
  }
  if (isRunActive(status)) {
    return "bg-[#F29F05]/20 text-[#8a5a00] dark:text-[#FFCC66]";
  }
  return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
}

function StatCard({ icon: Icon, title, value, subtitle, tone = "neutral", progressValue = null }) {
  const tones = {
    success: "bg-[#22c55e] text-white",
    warning: "bg-[#F29F05] text-black",
    danger: "bg-[#ef4444] text-white",
    neutral: "bg-[#3B82F6] text-white",
  };

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-all duration-200 p-3.5 flex items-center gap-3 h-full">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-[#0f0f1a] dark:text-white leading-none">{value}</p>
        <p className="text-[11px] text-[#0f0f1a]/60 dark:text-white/70 mt-1 uppercase font-semibold tracking-wide">{title}</p>
        {subtitle ? <p className="text-[10px] text-[#0f0f1a]/50 dark:text-white/60 truncate">{subtitle}</p> : null}
        {typeof progressValue === "number" ? (
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#0f0f1a]/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFAA00] to-[#ffb833]"
              style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export default function DashboardPage() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [runs, setRuns] = useState([]);
  const [plansCount, setPlansCount] = useState(0);
  const [projectCounts, setProjectCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);

  const handleAddProject = () => {
    setProjectsMenuOpen(false);
    const target = `/dashboard/${orgSlug}/execution/tests`;
    if (location.pathname === target) {
      window.dispatchEvent(new CustomEvent("openCreateProjectModal"));
      return;
    }

    navigate(target);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("openCreateProjectModal"));
    }, 120);
  };

  useEffect(() => {
    let cancelled = false;
    let isInitialLoad = true;
    const prevData = { projects: '[]', runs: '[]', plans: 0, counts: '{}' };

    async function load() {
      if (!orgSlug) return;
      if (isInitialLoad) setLoading(true);
      setError("");
      try {
        const [projectsData, runsData, plansData] = await Promise.all([
          fetchTestProjects(orgSlug),
          listRuns(orgSlug),
          listPlans(orgSlug),
        ]);
        if (cancelled) return;

        const normalizedProjects = Array.isArray(projectsData) ? projectsData : [];
        const normalizedRuns = Array.isArray(runsData) ? runsData : [];
        const normalizedPlans = Array.isArray(plansData) ? plansData : [];

        const projectsJson = JSON.stringify(normalizedProjects);
        const runsJson = JSON.stringify(normalizedRuns);
        const plansLen = normalizedPlans.length;

        if (projectsJson !== prevData.projects) {
          prevData.projects = projectsJson;
          setProjects(normalizedProjects);
        }
        if (runsJson !== prevData.runs) {
          prevData.runs = runsJson;
          setRuns(normalizedRuns);
        }
        if (plansLen !== prevData.plans) {
          prevData.plans = plansLen;
          setPlansCount(plansLen);
        }

        if (normalizedProjects.length > 0) {
          const countEntries = await Promise.all(
            normalizedProjects.map(async (project) => {
              const fallbackFolders = Number(project?._count?.folders ?? project?.folders?.length ?? 0);
              const fallbackTestCases = Number(project?._count?.testCases ?? 0);
              try {
                const tree = await fetchProjectTree(orgSlug, project.id);
                return [
                  String(project.id),
                  {
                    folders: Array.isArray(tree?.folders) ? tree.folders.length : fallbackFolders,
                    testCases: Array.isArray(tree?.testCases) ? tree.testCases.length : fallbackTestCases,
                  },
                ];
              } catch {
                return [
                  String(project.id),
                  {
                    folders: fallbackFolders,
                    testCases: fallbackTestCases,
                  },
                ];
              }
            }),
          );

          if (!cancelled) {
            const countsJson = JSON.stringify(countEntries);
            if (countsJson !== prevData.counts) {
              prevData.counts = countsJson;
              setProjectCounts(Object.fromEntries(countEntries));
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || t("dashboard.failedLoad"));
      } finally {
        if (!cancelled) {
          isInitialLoad = false;
          setLoading(false);
        }
      }
    }

    load();
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orgSlug]);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalRuns = runs.length;
    const successfulRuns = runs.filter((run) => {
      const passed = toSafeNumber(run?.passedTests);
      const failed = toSafeNumber(run?.failedTests);
      const skipped = toSafeNumber(run?.skippedTests);
      const total = toSafeNumber(run?.totalTests);
      const hasCounters = passed + failed + skipped > 0 || total > 0;
      if (hasCounters) {
        return failed === 0 && passed > 0;
      }
      return isRunSuccess(run?.status);
    }).length;

    const failedRuns = runs.filter((run) => {
      const passed = toSafeNumber(run?.passedTests);
      const failed = toSafeNumber(run?.failedTests);
      const skipped = toSafeNumber(run?.skippedTests);
      const total = toSafeNumber(run?.totalTests);
      const hasCounters = passed + failed + skipped > 0 || total > 0;
      if (hasCounters) {
        return failed > 0;
      }
      return isRunFailure(run?.status);
    }).length;

    const activeRuns = runs.filter((run) => isRunActive(run?.status)).length;
    const passedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.passedTests), 0);
    const failedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.failedTests), 0);
    const executedTests = passedTests + failedTests;
    const activeRunsRows = runs.filter((run) => isRunActive(run?.status));
    const livePassedTests = activeRunsRows.reduce((sum, run) => sum + toSafeNumber(run?.passedTests), 0);
    const liveFailedTests = activeRunsRows.reduce((sum, run) => sum + toSafeNumber(run?.failedTests), 0);
    const liveExecutedTests = livePassedTests + liveFailedTests;
    const totalTestCases = projects.reduce((sum, project) => sum + Number(projectCounts[String(project.id)]?.testCases || 0), 0);
    const successRate = executedTests > 0 ? Math.round((passedTests / executedTests) * 100) : 0;
    const liveQualityScore = liveExecutedTests > 0 ? Math.round((livePassedTests / liveExecutedTests) * 100) : successRate;

    return {
      totalProjects,
      totalRuns,
      successfulRuns,
      failedRuns,
      activeRuns,
      totalTestCases,
      passedTests,
      failedTests,
      executedTests,
      successRate,
      liveExecutedTests,
      liveQualityScore,
    };
  }, [projects, runs, projectCounts]);

  const cards = useMemo(() => {
    return [
      {
        title: t("dashboard.projects"),
        value: stats.totalProjects,
        subtitle: `${plansCount} ${t("dashboard.executionPlans")}`,
        icon: Folder,
        tone: "warning",
      },
      {
        title: t("dashboard.testCases"),
        value: stats.totalTestCases,
        subtitle: t("dashboard.acrossAllProjects"),
        icon: FileText,
        tone: "neutral",
      },
      {
        title: t("dashboard.successRate"),
        value: `${stats.successRate}%`,
        subtitle: `${stats.passedTests} ${t("dashboard.passed")} / ${stats.failedTests} ${t("dashboard.failed")}`,
        icon: CheckCircle,
        tone: "success",
      },
      {
        title: t("dashboard.failures"),
        value: stats.failedRuns,
        subtitle: `${stats.activeRuns} ${t("dashboard.activeRuns")}`,
        icon: AlertCircle,
        tone: "danger",
      },
    ];
  }, [plansCount, stats, t]);

  const trends = useMemo(() => {
    const passedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.passedTests), 0);
    const failedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.failedTests), 0);
    const executedTests = passedTests + failedTests;

    const done = executedTests > 0 ? Math.round((passedTests / executedTests) * 100) : 0;
    const failed = executedTests > 0 ? Math.round((failedTests / executedTests) * 100) : 0;

    const totalRuns = runs.length;
    const activeRuns = runs.filter((run) => isRunActive(run?.status)).length;
    const active = totalRuns > 0 ? Math.round((activeRuns / totalRuns) * 100) : 0;

    return [
      { label: t("dashboard.success"), value: done, colorKey: "Success" },
      { label: t("dashboard.running"), value: active, colorKey: "Running" },
      { label: t("dashboard.failed"), value: failed, colorKey: "Failed" },
    ];
  }, [runs, t]);

  const recentRuns = useMemo(() => {
    return runs
      .slice()
      .sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))
      .slice(0, 5);
  }, [runs]);

  const projectQualityGraph = useMemo(() => {
    const byProject = projects.map((project) => {
      const projectId = String(project?.id || "");
      const projectRuns = runs.filter((run) => String(run?.projectId || "") === projectId);
      const passed = projectRuns.reduce((sum, run) => sum + toSafeNumber(run?.passedTests), 0);
      const failed = projectRuns.reduce((sum, run) => sum + toSafeNumber(run?.failedTests), 0);
      const executed = passed + failed;
      const runCount = projectRuns.length;
      const successRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;
      return {
        id: projectId,
        name: project?.name || t("dashboard.projectFallback"),
        runCount,
        passed,
        failed,
        executed,
        successRate,
        totalCases: Number(projectCounts[projectId]?.testCases || 0),
      };
    });

    return byProject
      .sort((a, b) => b.executed - a.executed || b.runCount - a.runCount)
      .slice(0, 6);
  }, [projects, runs, projectCounts]);

  const liveTimelineGraph = useMemo(() => {
    const bucketCount = 10;
    const bucketSizeMs = 3 * 60 * 60 * 1000;
    const now = Date.now();

    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const start = now - (bucketCount - index) * bucketSizeMs;
      const end = start + bucketSizeMs;
      return {
        index,
        start,
        end,
        label: new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        total: 0,
        success: 0,
      };
    });

    for (const run of runs) {
      const ts = new Date(run?.updatedAt || run?.createdAt || 0).getTime();
      if (!ts || ts < buckets[0].start || ts > buckets[bucketCount - 1].end) continue;
      const index = Math.min(Math.floor((ts - buckets[0].start) / bucketSizeMs), bucketCount - 1);
      const bucket = buckets[index];
      bucket.total += 1;
      if (isRunSuccess(run?.status)) {
        bucket.success += 1;
      }
    }

    const maxTotal = Math.max(1, ...buckets.map((bucket) => bucket.total));
    return {
      buckets,
      maxTotal,
      latestRuns: buckets[bucketCount - 1]?.total || 0,
      latestSuccessRate:
        buckets[bucketCount - 1]?.total > 0
          ? Math.round((buckets[bucketCount - 1].success / buckets[bucketCount - 1].total) * 100)
          : 0,
    };
  }, [runs]);

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 overflow-y-auto text-[#0f0f1a] dark:text-white flex flex-col gap-3 p-4 lg:p-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Aeonik', sans-serif" }}>{t("dashboard.title")}</h1>
            <p className="text-sm text-[#0f0f1a]/70 dark:text-white/70">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/dashboard/${orgSlug}/execution/tests`} className="bg-[#F29F05] hover:bg-[#e5a22e] text-black font-semibold rounded-lg px-3 py-1.5 text-sm shadow-sm inline-flex items-center gap-2 transition-all duration-200 hover:shadow-md">
              <PlayCircle className="h-4 w-4" />
              {t("dashboard.openProjects")}
            </Link>
            <Link to={`/dashboard/${orgSlug}/platform`} className="rounded-lg border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 px-3 py-1.5 text-sm hover:bg-[#0f0f1a]/5 dark:hover:bg-white/5 transition-all duration-200">
              {t("dashboard.teamAccess")}
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading && projects.length === 0 ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 p-6 text-sm text-[#0f0f1a]/60 dark:text-white/60 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("dashboard.loadingOrg")}
          </div>
        ) : null}

        {!loading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center mb-5">
              <FolderPlus className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t("dashboard.noProjects")}</h2>
            <p className="text-sm text-muted-foreground max-w-md text-center mb-6">{t("dashboard.noProjectsDesc")}</p>
            <button
              type="button"
              onClick={handleAddProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              {t("dashboard.createFirstProject")}
            </button>
          </div>
        ) : null}

        {projects.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
              {cards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] p-4 transition-all duration-200 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t("dashboard.orgVelocity")}
                  </h3>
                  <div className="text-right">
                    <p className="text-[11px] text-[#0f0f1a]/60 dark:text-white/70">{t("dashboard.latestWindow")}</p>
                    <p className="text-xs font-semibold text-[#0f0f1a]/80 dark:text-white/90">
                      {liveTimelineGraph.latestRuns} {t("common.runs")} • {liveTimelineGraph.latestSuccessRate}% {t("dashboard.success")}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="h-[220px] md:h-[250px] rounded-xl border border-black/10 dark:border-white/10 bg-background/40 p-3 flex items-end gap-2">
                    {liveTimelineGraph.buckets.map((bucket) => {
                      const totalHeight = Math.max(6, Math.round((bucket.total / liveTimelineGraph.maxTotal) * 100));
                      const successRatio = bucket.total > 0 ? Math.round((bucket.success / bucket.total) * 100) : 0;
                      return (
                        <div key={`${bucket.label}-${bucket.index}`} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
                          <div className="w-full flex flex-col justify-end h-36 rounded-md bg-[#0f0f1a]/10 dark:bg-white/10 overflow-hidden">
                            <div className="w-full bg-gradient-to-t from-[#FFAA00] to-[#ffb833]" style={{ height: `${totalHeight}%` }} />
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#0f0f1a]/10 dark:bg-white/10 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${successRatio}%` }} />
                          </div>
                          <p className="text-[10px] text-[#0f0f1a]/60 dark:text-white/60 truncate max-w-full">{bucket.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#0f0f1a]/75 dark:text-white/80">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-background/50 px-2 py-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-[#F29F05] shrink-0" />
                      {t("dashboard.runsVolume")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-background/50 px-2 py-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      {t("dashboard.successRatio")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] p-4 transition-all duration-200 min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {t("dashboard.recentTestRuns")}
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {runs.length === 0 ? (
                    <p className="text-sm text-[#0f0f1a]/60 dark:text-white/60">{t("dashboard.noTestRuns")}</p>
                  ) : (
                    recentRuns.map((run) => (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => navigate(`/dashboard/${orgSlug}/execution/runs/${run.id}`)}
                        className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-background/50 hover:bg-[#0f0f1a]/5 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{run.plan?.name || run.project?.name || run.id?.slice(0, 12) || t("dashboard.runFallback")}</p>
                          <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(run.status)}`}>
                            {run.status || t("common.unknown")}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#0f0f1a]/50 dark:text-white/50">{formatTimeAgo(run.updatedAt, t)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] p-4 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t("dashboard.executionTrends")}
                  </h3>
                  <span className="text-[11px] text-[#0f0f1a]/60 dark:text-white/70">{t("dashboard.lastRuns")}</span>
                </div>
                {trends.length === 0 ? (
                  <p className="text-sm text-[#0f0f1a]/60 dark:text-white/60">{t("dashboard.noTrendData")}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {trends.map((trend) => {
                      const colors = {
                        Success: { bar: "from-emerald-500 to-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
                        Failed: { bar: "from-red-500 to-red-400", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
                        Running: { bar: "from-blue-500 to-blue-400", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
                      };
                      const c = colors[trend.colorKey] || { bar: "from-[#FFAA00] to-[#ffb833]", bg: "bg-[#FFAA00]/10", text: "text-[#FFAA00]" };
                      return (
                        <div key={trend.label} className="rounded-xl border border-black/6 dark:border-white/8 bg-background/40 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${c.text}`}>{trend.label}</span>
                            <span className={`text-lg font-bold ${c.text}`}>{trend.value}%</span>
                          </div>
                          <div className="h-2 bg-[#0f0f1a]/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${c.bar} transition-all duration-500`} style={{ width: `${trend.value}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

