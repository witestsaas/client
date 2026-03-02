import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { fetchProjectTree, fetchTestProjects } from "../services/testManagement";
import { listPlans, listRuns } from "../services/executionReporting";

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDuration(value) {
  const milliseconds = toSafeNumber(value);
  if (!milliseconds) return "N/A";

  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (totalHours > 0) {
    return `${totalHours}h ${minutes}m`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatDate(value) {
  if (!value) return "No runs yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No runs yet";
  return date.toLocaleString();
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase();
}

function statusBadgeClass(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "completed" || normalized === "passed" || normalized === "success") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }
  if (normalized === "failed" || normalized === "error" || normalized === "cancelled" || normalized === "aborted") {
    return "bg-red-500/15 text-red-700 dark:text-red-300";
  }
  if (normalized === "running" || normalized === "queued" || normalized === "pending" || normalized === "inprogress") {
    return "bg-[#FFAA00]/20 text-[#8a5a00] dark:text-[#FFCC66]";
  }
  return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
}

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildTrendFromRuns(runs, days = 7) {
  if (!Array.isArray(runs) || runs.length === 0) return [];

  const sorted = [...runs].sort(
    (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
  );
  const anchor = new Date(sorted[0]?.createdAt || Date.now());
  anchor.setHours(0, 0, 0, 0);

  const buckets = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(anchor);
    day.setDate(anchor.getDate() - i);
    buckets.set(day.toISOString().slice(0, 10), { total: 0, passed: 0, runs: 0 });
  }

  sorted.forEach((run) => {
    const key = toDateKey(run?.createdAt);
    if (!key || !buckets.has(key)) return;

    const passed = toSafeNumber(run?.passedTests);
    const failed = toSafeNumber(run?.failedTests);
    const skipped = toSafeNumber(run?.skippedTests);
    const totalFromCounters = passed + failed + skipped;
    const total = totalFromCounters > 0 ? totalFromCounters : toSafeNumber(run?.totalTests);

    const bucket = buckets.get(key);
    bucket.total += total;
    bucket.passed += passed;
    bucket.runs += 1;
  });

  return Array.from(buckets.entries()).map(([date, item]) => ({
    date,
    totalRuns: item.runs,
    passRate: item.total > 0 ? Math.round((item.passed / item.total) * 100) : 0,
  }));
}

function KpiCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.24)] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#FFAA00]/15 text-[#b17200] dark:text-[#FFCC66] inline-flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#232323]/60 dark:text-white/65 uppercase tracking-wide font-semibold">{title}</p>
        <p className="text-xl font-semibold text-[#232323] dark:text-white leading-tight">{value}</p>
        {subtitle ? <p className="text-[11px] text-[#232323]/55 dark:text-white/55">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function ExecutionResults() {
  const { orgSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [runs, setRuns] = useState([]);
  const [plansCount, setPlansCount] = useState(0);
  const [testCasesCount, setTestCasesCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(
    async (initial = false) => {
      if (!orgSlug) return;
      if (initial) setLoading(true);
      setError("");

      try {
        const projectRows = await fetchTestProjects(orgSlug);
        const normalizedProjects = Array.isArray(projectRows) ? projectRows : [];
        setProjects(normalizedProjects);

        const savedProjectId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(`selectedProject_${orgSlug}`) || ""
            : "";

        const fallbackProjectId = projectId || normalizedProjects[0]?.id || "";
        const syncedProjectId =
          savedProjectId && normalizedProjects.some((project) => String(project.id) === String(savedProjectId))
            ? savedProjectId
            : fallbackProjectId;

        if (syncedProjectId && String(syncedProjectId) !== String(projectId)) {
          setProjectId(syncedProjectId);
        }

        if (!syncedProjectId) {
          setRuns([]);
          setPlansCount(0);
          setTestCasesCount(0);
          return;
        }

        const [runRows, planRows, tree] = await Promise.all([
          listRuns(orgSlug, { projectId: syncedProjectId }),
          listPlans(orgSlug, { projectId: syncedProjectId }),
          fetchProjectTree(orgSlug, syncedProjectId),
        ]);

        setRuns(Array.isArray(runRows) ? runRows : []);
        setPlansCount(Array.isArray(planRows) ? planRows.length : 0);
        setTestCasesCount(Array.isArray(tree?.testCases) ? tree.testCases.length : 0);
      } catch (err) {
        setError(err?.message || "Failed to load reports");
      } finally {
        if (initial) setLoading(false);
      }
    },
    [orgSlug, projectId],
  );

  useEffect(() => {
    loadData(true);
    const timer = window.setInterval(() => loadData(false), 30000);
    return () => window.clearInterval(timer);
  }, [loadData, refreshKey]);

  useEffect(() => {
    if (!orgSlug) return;
    const onProjectChange = (event) => {
      const nextOrgSlug = event?.detail?.orgSlug;
      const nextProjectId = event?.detail?.projectId;
      if (nextOrgSlug === orgSlug && nextProjectId) {
        setProjectId(nextProjectId);
      }
    };
    window.addEventListener("selectedProjectChanged", onProjectChange);
    return () => window.removeEventListener("selectedProjectChanged", onProjectChange);
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug || !projectId || typeof window === "undefined") return;
    window.localStorage.setItem(`selectedProject_${orgSlug}`, projectId);
  }, [orgSlug, projectId]);

  useEffect(() => {
    if (!orgSlug || !projectId) return;
    loadData(false);
  }, [orgSlug, projectId, loadData]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(projectId)) || null,
    [projects, projectId],
  );

  const kpis = useMemo(() => {
    const totalRuns = runs.length;
    const totalTests = runs.reduce((sum, run) => {
      const fromTotal = toSafeNumber(run?.totalTests);
      if (fromTotal > 0) return sum + fromTotal;
      const passed = toSafeNumber(run?.passedTests);
      const failed = toSafeNumber(run?.failedTests);
      const skipped = toSafeNumber(run?.skippedTests);
      return sum + passed + failed + skipped;
    }, 0);
    const passedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.passedTests), 0);
    const failedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.failedTests), 0);
    const skippedTests = runs.reduce((sum, run) => sum + toSafeNumber(run?.skippedTests), 0);

    const denominator = totalTests > 0 ? totalTests : passedTests + failedTests;
    const passRate = denominator > 0 ? Math.round((passedTests / denominator) * 100) : 0;
    const failedRate = denominator > 0 ? Math.round((failedTests / denominator) * 100) : 0;

    const durationRows = runs.map((run) => toSafeNumber(run?.duration)).filter((value) => value > 0);
    const avgDuration = durationRows.length
      ? Math.round(durationRows.reduce((sum, value) => sum + value, 0) / durationRows.length)
      : 0;

    const sorted = [...runs].sort(
      (a, b) => new Date(b?.createdAt || b?.updatedAt || 0).getTime() - new Date(a?.createdAt || a?.updatedAt || 0).getTime(),
    );

    return {
      totalRuns,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate,
      failedRate,
      avgDuration,
      lastRunAt: sorted[0]?.createdAt || sorted[0]?.updatedAt || null,
    };
  }, [runs]);

  const trend = useMemo(() => buildTrendFromRuns(runs, 7), [runs]);

  const recentRuns = useMemo(
    () =>
      [...runs]
        .sort(
          (a, b) =>
            new Date(b?.createdAt || b?.updatedAt || 0).getTime() - new Date(a?.createdAt || a?.updatedAt || 0).getTime(),
        )
        .slice(0, 8),
    [runs],
  );

  const statusBreakdown = useMemo(() => {
    const counters = new Map();
    runs.forEach((run) => {
      const key = String(run?.status || "Unknown");
      counters.set(key, (counters.get(key) || 0) + 1);
    });
    return Array.from(counters.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [runs]);

  const cards = useMemo(
    () => [
      {
        title: "Total Runs",
        value: kpis.totalRuns,
        subtitle: `${plansCount} execution plan${plansCount === 1 ? "" : "s"}`,
        icon: Layers,
      },
      {
        title: "Pass Rate",
        value: `${kpis.passRate}%`,
        subtitle: `${kpis.passedTests} passed · ${kpis.failedTests} failed`,
        icon: TrendingUp,
      },
      {
        title: "Total Tests",
        value: kpis.totalTests,
        subtitle: `${testCasesCount} project test case${testCasesCount === 1 ? "" : "s"}`,
        icon: BarChart3,
      },
      {
        title: "Avg Duration",
        value: formatDuration(kpis.avgDuration),
        subtitle: `Last run: ${formatDate(kpis.lastRunAt)}`,
        icon: Clock,
      },
    ],
    [kpis, plansCount, testCasesCount],
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 text-[#232323] dark:text-white">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-[#232323]/65 dark:text-white/65">
              {selectedProject
                ? `Project-level quality insights for ${selectedProject.name || "selected project"}.`
                : "Select a project from the header to view project reports."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="h-9 px-3 rounded-md border border-black/10 dark:border-white/10 inline-flex items-center gap-2 text-sm font-semibold hover:bg-[#232323]/5 dark:hover:bg-white/5"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {loading && !selectedProject ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-6 text-sm text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reports...
          </div>
        ) : null}

        {!loading && !selectedProject ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-6 text-sm text-[#232323]/65 dark:text-white/65">
            No project selected. Choose a project from the header project switcher.
          </div>
        ) : null}

        {selectedProject ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map((card) => (
                <KpiCard
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.22)] p-4">
                <p className="text-sm font-semibold mb-3">Pass Rate Trend (7 days)</p>
                {trend.length ? (
                  <div className="flex items-end gap-2 h-44">
                    {trend.map((point) => (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                        <div className="w-full h-32 rounded-md bg-background/80 border border-black/5 dark:border-white/10 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-gradient-to-t from-[#FFAA00] to-[#F5A623]"
                            style={{ height: `${Math.max(Number(point.passRate || 0), 5)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[#232323]/55 dark:text-white/55">{point.date.slice(5)}</p>
                        <p className="text-[10px] text-[#232323]/45 dark:text-white/45">{point.passRate}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#232323]/60 dark:text-white/60">No trend data yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.22)] p-4">
                <p className="text-sm font-semibold mb-3">Run Status Breakdown</p>
                <div className="space-y-2">
                  {statusBreakdown.length ? (
                    statusBreakdown.map((item) => (
                      <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
                        <span className={`inline-flex h-6 px-2 rounded-md items-center text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="text-[#232323]/70 dark:text-white/70">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">No run status data.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 bg-card/95 shadow-[0_6px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.22)] p-4">
              <p className="text-sm font-semibold mb-3">Recent Runs</p>
              {recentRuns.length ? (
                <div className="space-y-2">
                  {recentRuns.map((run) => {
                    const passed = toSafeNumber(run?.passedTests);
                    const failed = toSafeNumber(run?.failedTests);
                    const skipped = toSafeNumber(run?.skippedTests);
                    const total = toSafeNumber(run?.totalTests) || passed + failed + skipped;

                    return (
                      <div
                        key={String(run?.id || `${run?.createdAt || "run"}-${run?.status || ""}`)}
                        className="rounded-lg border border-black/10 dark:border-white/10 bg-background/60 px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{run?.testPlan?.name || run?.planName || "Execution Run"}</p>
                          <p className="text-xs text-[#232323]/60 dark:text-white/60 truncate">
                            {passed}/{total || 0} passed · {formatDuration(run?.duration)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex h-6 px-2 rounded-md items-center text-xs font-semibold ${statusBadgeClass(run?.status)}`}>
                            {run?.status || "Unknown"}
                          </span>
                          <p className="text-[10px] text-[#232323]/50 dark:text-white/50 mt-1">{formatDate(run?.createdAt || run?.updatedAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  No runs yet for this project.
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

