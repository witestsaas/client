import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  FileText,
  Folder,
  Loader2,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchProjectTree, fetchTestProjects } from "../services/testManagement";
import { listPlans, listRuns } from "../services/executionReporting";

function formatTimeAgo(dateString) {
  if (!dateString || dateString === "-") return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
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
    return "bg-[#FFAA00]/20 text-[#8a5a00] dark:text-[#FFCC66]";
  }
  return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
}

function StatCard({ icon: Icon, title, value, subtitle, tone = "neutral", progressValue = null }) {
  const tones = {
    success: "bg-[#22c55e] text-white",
    warning: "bg-[#FFAA00] text-black",
    danger: "bg-[#ef4444] text-white",
    neutral: "bg-[#3B82F6] text-white",
  };

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-all duration-200 p-3.5 flex items-center gap-3 h-full">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold text-[#232323] dark:text-white leading-none">{value}</p>
        <p className="text-[11px] text-[#232323]/60 dark:text-white/70 mt-1 uppercase font-semibold tracking-wide">{title}</p>
        {subtitle ? <p className="text-[10px] text-[#232323]/50 dark:text-white/60 truncate">{subtitle}</p> : null}
        {typeof progressValue === "number" ? (
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#232323]/10 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFAA00] to-[#FFBF3F]"
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
  const [projects, setProjects] = useState([]);
  const [runs, setRuns] = useState([]);
  const [plansCount, setPlansCount] = useState(0);
  const [projectCounts, setProjectCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!orgSlug) return;
      setLoading(true);
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

        setProjects(normalizedProjects);
        setRuns(normalizedRuns);
        setPlansCount(normalizedPlans.length);

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
          setProjectCounts(Object.fromEntries(countEntries));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 5000);
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
        title: "Projects",
        value: stats.totalProjects,
        subtitle: `${plansCount} execution plans`,
        icon: Folder,
        tone: "warning",
      },
      {
        title: "Test Cases",
        value: stats.totalTestCases,
        subtitle: "Across all projects",
        icon: FileText,
        tone: "neutral",
      },
      {
        title: "Success Rate",
        value: `${stats.successRate}%`,
        subtitle: `${stats.passedTests} passed / ${stats.failedTests} failed`,
        icon: CheckCircle,
        tone: "success",
      },
      {
        title: "Failures",
        value: stats.failedRuns,
        subtitle: `${stats.activeRuns} active run${stats.activeRuns === 1 ? "" : "s"}`,
        icon: AlertCircle,
        tone: "danger",
      },
    ];
  }, [plansCount, stats]);

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
      { label: "Success", value: done },
      { label: "Running", value: active },
      { label: "Failed", value: failed },
    ];
  }, [runs]);

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
        name: project?.name || "Project",
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
      <div className="h-full min-h-0 overflow-hidden text-[#232323] dark:text-white flex flex-col gap-3">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Dashboard</h1>
            <p className="text-sm text-[#232323]/70 dark:text-white/70">Overview of your testing suite performance.</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/dashboard/${orgSlug}/execution/tests`} className="bg-[#FFAA00] hover:bg-[#FFB733] text-black font-semibold rounded-lg px-3 py-1.5 text-sm shadow-sm inline-flex items-center gap-2 transition-all duration-200 hover:shadow-md">
              <PlayCircle className="h-4 w-4" />
              Open Projects
            </Link>
            <Link to={`/dashboard/${orgSlug}/platform`} className="rounded-lg border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 px-3 py-1.5 text-sm hover:bg-[#232323]/5 dark:hover:bg-white/5 transition-all duration-200">
              Team Access
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading && projects.length === 0 ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 p-6 text-sm text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading organization dashboard...
          </div>
        ) : null}

        {!loading || projects.length > 0 ? (
          <div className="flex-1 min-h-0 grid grid-rows-[auto_auto_1fr] gap-3 overflow-hidden">
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
                    Organization Velocity (Last 30h)
                  </h3>
                  <div className="text-right">
                    <p className="text-[11px] text-[#232323]/60 dark:text-white/70">Latest window</p>
                    <p className="text-xs font-semibold text-[#232323]/80 dark:text-white/90">
                      {liveTimelineGraph.latestRuns} runs • {liveTimelineGraph.latestSuccessRate}% success
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
                          <div className="w-full flex flex-col justify-end h-36 rounded-md bg-[#232323]/10 dark:bg-white/10 overflow-hidden">
                            <div className="w-full bg-gradient-to-t from-[#FFAA00] to-[#FFBF3F]" style={{ height: `${totalHeight}%` }} />
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#232323]/10 dark:bg-white/10 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${successRatio}%` }} />
                          </div>
                          <p className="text-[10px] text-[#232323]/60 dark:text-white/60 truncate max-w-full">{bucket.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#232323]/75 dark:text-white/80">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-background/50 px-2 py-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-[#FFAA00] shrink-0" />
                      Runs volume
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-background/50 px-2 py-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      Success ratio
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] p-4 transition-all duration-200 min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Recent Test Runs
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {runs.length === 0 ? (
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">No test runs yet.</p>
                  ) : (
                    recentRuns.map((run) => (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => navigate(`/dashboard/${orgSlug}/execution/runs/${run.id}`)}
                        className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-background/50 hover:bg-[#232323]/5 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{run.plan?.name || run.project?.name || run.id?.slice(0, 12) || "Run"}</p>
                          <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(run.status)}`}>
                            {run.status || "Unknown"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#232323]/50 dark:text-white/50">{formatTimeAgo(run.updatedAt)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 min-h-0">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] p-4 transition-all duration-200 min-h-0 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Project Quality Score
                  </h3>
                  <span className="text-[11px] text-[#232323]/60 dark:text-white/70">Auto-refresh 30s</span>
                </div>
                {projectQualityGraph.length === 0 ? (
                  <p className="text-sm text-[#232323]/60 dark:text-white/60">No project data available yet.</p>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                    {projectQualityGraph.map((project) => {
                      const passRatio = project.executed > 0 ? (project.passed / project.executed) * 100 : 0;
                      const failRatio = project.executed > 0 ? (project.failed / project.executed) * 100 : 0;
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => navigate(`/dashboard/${orgSlug}/execution/tests/${project.id}`)}
                          className="w-full text-left rounded-xl border border-black/10 dark:border-white/10 bg-background/40 hover:bg-[#232323]/5 dark:hover:bg-white/5 p-3 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <p className="text-xs font-semibold truncate">{project.name}</p>
                            <p className="text-xs font-bold text-[#232323]/80 dark:text-white/90">{project.successRate}%</p>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-[#232323]/10 dark:bg-white/10 overflow-hidden flex">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${passRatio}%` }} />
                            <div className="h-full bg-gradient-to-r from-red-500 to-red-400" style={{ width: `${failRatio}%` }} />
                          </div>
                          <div className="mt-1.5 text-[11px] text-[#232323]/60 dark:text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{project.executed} tests executed</span>
                            <span>{project.runCount} run{project.runCount === 1 ? "" : "s"}</span>
                            <span>{project.totalCases} test case{project.totalCases === 1 ? "" : "s"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)] p-4 transition-all duration-200 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Execution Trends
                  </h3>
                  <span className="text-[11px] text-[#232323]/60 dark:text-white/70">Last runs</span>
                </div>
                <div className="space-y-1.5">
                  {trends.length === 0 ? (
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">No trend data yet.</p>
                  ) : (
                    trends.map((trend) => (
                      <div key={trend.label} className="flex items-center gap-3">
                        <span className="text-xs w-20">{trend.label}</span>
                        <div className="flex-1 h-2.5 bg-[#232323]/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FFAA00] to-[#FFBF3F]" style={{ width: `${trend.value}%` }} />
                        </div>
                        <span className="text-[11px] text-[#232323]/60 dark:text-white/70">{trend.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

