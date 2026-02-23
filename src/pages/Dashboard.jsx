import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Folder,
  PlayCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchActivity, fetchStats, fetchTestExecutions, fetchTrends } from "../services/api";

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

function StatCard({ icon: Icon, title, value, subtitle, tone = "neutral" }) {
  const tones = {
    success: "bg-[#22c55e] text-white",
    warning: "bg-[#FFAA00] text-black",
    danger: "bg-[#ef4444] text-white",
    neutral: "bg-[#3B82F6] text-white",
  };

  return (
    <div className="bg-card border border-border hover:border-[#FFAA00]/60 hover:shadow-md transition-all rounded-xl p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-[#232323] dark:text-white leading-none">{value}</p>
        <p className="text-xs text-[#232323]/60 dark:text-white/70 mt-1 uppercase font-semibold tracking-wide">{title}</p>
        {subtitle ? <p className="text-[10px] text-[#232323]/50 dark:text-white/60">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { orgSlug } = useParams();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [runs, setRuns] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [statsData, trendsData, runsData, activityData] = await Promise.all([
          fetchStats(),
          fetchTrends(),
          fetchTestExecutions(),
          fetchActivity(),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setTrends(Array.isArray(trendsData) ? trendsData : []);
        setRuns(runsData?.testRuns || []);
        setActivity(Array.isArray(activityData) ? activityData : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const cards = useMemo(() => {
    if (!stats) return [];
    const failedPct = 100 - (stats.successRate || 0);
    return [
      { title: "Success Rate", value: `${stats.successRate || 0}%`, icon: CheckCircle, tone: "success" },
      { title: "Total Test Cases", value: stats.testCases ?? 0, icon: FileText, tone: "neutral" },
      { title: "Failures", value: `${failedPct}%`, icon: AlertCircle, tone: "danger" },
      { title: "Projects", value: stats.projects ?? 0, icon: Folder, tone: "warning" },
    ];
  }, [stats]);

  return (
    <DashboardLayout>
      <div className="space-y-4 text-[#232323] dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-base text-[#232323]/70 dark:text-white/70">Overview of your testing suite performance.</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/dashboard/${orgSlug}/execution`} className="bg-[#FFAA00] hover:bg-[#FFB733] text-black font-semibold rounded-lg px-4 py-2 shadow-sm inline-flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Run Suite
            </Link>
            <Link to={`/dashboard/${orgSlug}/platform`} className="rounded-lg border border-border px-4 py-2 hover:border-[#FFAA00]/60">
              Team Access
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {loading && !stats ? (
          <div className="text-sm text-[#232323]/60 dark:text-white/60">Loading dashboard...</div>
        ) : null}

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {cards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 hover:border-[#FFAA00]/60 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Execution Trends
                  </h3>
                  <span className="text-xs text-[#232323]/60 dark:text-white/70">Last runs</span>
                </div>
                <div className="space-y-2">
                  {trends.length === 0 ? (
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">No trend data yet.</p>
                  ) : (
                    trends.map((trend) => (
                      <div key={trend.label} className="flex items-center gap-3">
                        <span className="text-sm w-24">{trend.label}</span>
                        <div className="flex-1 h-2 bg-[#232323]/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFAA00]" style={{ width: `${trend.value}%` }} />
                        </div>
                        <span className="text-xs text-[#232323]/60 dark:text-white/70">{trend.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 hover:border-[#FFAA00]/60 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Recent Test Runs
                  </h3>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {runs.length === 0 ? (
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">No test runs yet.</p>
                  ) : (
                    runs.slice(0, 8).map((run) => (
                      <div key={run.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#232323]/5 dark:hover:bg-white/5">
                        <div>
                          <p className="text-sm font-medium">{run.id.slice(0, 12)}...</p>
                          <p className="text-xs text-[#232323]/60 dark:text-white/60">{run.status}</p>
                        </div>
                        <p className="text-xs text-[#232323]/50 dark:text-white/50">{formatTimeAgo(run.updatedAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 hover:border-[#FFAA00]/60 transition-all">
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Folder className="h-4 w-4" />
                  Projects Overview
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#232323]/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xl font-semibold">{stats.projects}</p>
                    <p className="text-xs text-[#232323]/60 dark:text-white/70">Total Projects</p>
                  </div>
                  <div className="p-3 bg-[#232323]/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xl font-semibold">{runs.length}</p>
                    <p className="text-xs text-[#232323]/60 dark:text-white/70">Total Runs</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 hover:border-[#FFAA00]/60 transition-all">
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {activity.length === 0 ? (
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">No recent activity.</p>
                  ) : (
                    activity.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#232323]/5 dark:hover:bg-white/5">
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-[#232323]/60 dark:text-white/60">{item.user}</p>
                        </div>
                        <p className="text-xs text-[#232323]/50 dark:text-white/50">{formatTimeAgo(item.time)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

