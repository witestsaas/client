import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Monitor,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchPerformanceOverview, fetchSessionMetrics } from "../services/platform";

function StatCard({ icon: Icon, label, value, sub, color = "text-emerald-500" }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-[#232323] dark:text-white">{value}</p>
      {sub && <p className="text-xs text-[#232323]/50 dark:text-white/50 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color = "bg-emerald-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Performance() {
  const { orgSlug } = useParams();
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!orgSlug) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, se] = await Promise.all([
        fetchPerformanceOverview(orgSlug, days),
        fetchSessionMetrics(orgSlug),
      ]);
      setOverview(ov);
      setSessions(se);
    } catch (e) {
      setError(e?.message || "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, days]);

  useEffect(() => { load(); }, [load]);

  const summary = overview?.summary;
  const daily = overview?.dailyTrend || [];
  const browsers = overview?.browserBreakdown || [];
  const flaky = overview?.flakyTests || [];
  const maxDailyRuns = Math.max(...daily.map((d) => d.runs || 0), 1);

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 overflow-y-auto max-w-7xl mx-auto space-y-8 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#232323] dark:text-white">Performance</h1>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">Test execution analytics and session monitoring</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFAA00] border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BarChart3} label="Total Runs" value={summary.totalRuns ?? 0} sub={`last ${days} days`} color="text-blue-500" />
              <StatCard icon={TrendingUp} label="Pass Rate" value={`${(summary.passRate ?? 0).toFixed(1)}%`} sub="passed / total" color="text-emerald-500" />
              <StatCard icon={Clock} label="Avg Duration" value={`${((summary.avgDuration ?? 0) / 1000).toFixed(1)}s`} sub={summary.p50 ? `P50 ${(summary.p50 / 1000).toFixed(1)}s · P90 ${(summary.p90 / 1000).toFixed(1)}s` : null} color="text-amber-500" />
              <StatCard icon={Zap} label="P99 Duration" value={`${((summary.p99 ?? 0) / 1000).toFixed(1)}s`} sub="99th percentile" color="text-purple-500" />
            </div>

            {/* Sessions */}
            {sessions && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Sessions (24h)" value={sessions.totalSessions ?? 0} color="text-cyan-500" />
                <StatCard icon={Activity} label="Avg Duration" value={`${((sessions.avgDuration ?? 0) / 1000).toFixed(1)}s`} color="text-indigo-500" />
                <StatCard icon={Monitor} label="Peak Concurrent" value={sessions.peakConcurrent ?? 0} color="text-rose-500" />
              </div>
            )}

            {/* Daily Trend */}
            {daily.length > 0 && (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                <div className="px-5 py-4 border-b border-black/10 dark:border-white/10">
                  <p className="font-semibold text-[#232323] dark:text-white">Daily Trend</p>
                </div>
                <div className="p-5 overflow-x-auto">
                  <div className="flex items-end gap-1" style={{ minWidth: daily.length * 28 }}>
                    {daily.map((d) => {
                      const h = Math.max((d.runs / maxDailyRuns) * 120, 4);
                      const pass = d.passRate ?? 0;
                      const barColor = pass >= 80 ? "bg-emerald-500" : pass >= 50 ? "bg-amber-500" : "bg-red-500";
                      return (
                        <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[24px]" title={`${d.date}: ${d.runs} runs, ${pass.toFixed(0)}% pass`}>
                          <div className={`w-full max-w-[20px] rounded-t ${barColor}`} style={{ height: h }} />
                          <span className="text-[9px] text-[#232323]/40 dark:text-white/40 whitespace-nowrap">{d.date.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Browser Breakdown + Flaky Tests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Browser Breakdown */}
              {browsers.length > 0 && (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                  <div className="px-5 py-4 border-b border-black/10 dark:border-white/10">
                    <p className="font-semibold text-[#232323] dark:text-white">Browser Breakdown</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {browsers.map((b) => (
                      <div key={b.browser} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#232323] dark:text-white font-medium capitalize">{b.browser || "Unknown"}</span>
                          <span className="text-[#232323]/60 dark:text-white/60">{b.runs} runs</span>
                        </div>
                        <MiniBar value={b.runs} max={browsers[0]?.runs || 1} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flaky Tests */}
              {flaky.length > 0 && (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                  <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="font-semibold text-[#232323] dark:text-white">Flaky Tests</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {flaky.slice(0, 10).map((t, i) => (
                      <div key={t.testCaseId || i} className="flex items-center justify-between text-sm">
                        <span className="text-[#232323] dark:text-white truncate max-w-[60%]">{t.name || t.testCaseId}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{(t.flakyRate * 100).toFixed(0)}% flaky</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!loading && !error && (!summary || summary.totalRuns === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-[#232323]/20 dark:text-white/20 mb-4" />
            <p className="text-lg font-semibold text-[#232323] dark:text-white">No data yet</p>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">Run some test plans to see performance analytics here</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
