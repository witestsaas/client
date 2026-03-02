import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, MessageCircle, Play, RefreshCw, Square, Folder, Send, X } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../auth/AuthProvider.jsx";
import { MentionInput } from "../components/MentionInput.tsx";
import { cancelRun, createRunActivity, getRun, listRunActivities, rerunRun } from "../services/executionReporting";
import { RunDetailsModal } from "./ExecutionRuns.jsx";

const resultStatusClass = {
  Pending: "bg-gray-100 text-gray-700",
  Queued: "bg-amber-100 text-amber-700",
  Running: "bg-blue-100 text-blue-700",
  Passed: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Error: "bg-red-100 text-red-700",
  Skipped: "bg-gray-100 text-gray-700",
  Cancelled: "bg-orange-100 text-orange-700",
};

function statusIcon(status) {
  if (status === "Running") return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
  if (status === "Completed" || status === "Passed") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "Failed" || status === "Error") return <AlertCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-gray-500" />;
}

function formatActivityTime(value) {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ExecutionRunDetail() {
  const { orgSlug, runId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySending, setActivitySending] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activityItems, setActivityItems] = useState([]);
  const [activityDraft, setActivityDraft] = useState("");
  const [activityUnreadCount, setActivityUnreadCount] = useState(0);
  const [lastSeenActivityId, setLastSeenActivityId] = useState("");
  const activityEndRef = useRef(null);

  const loadRun = async () => {
    if (!orgSlug || !runId) return;
    if (!run) setLoading(true);
    try {
      const data = await getRun(orgSlug, runId);
      setRun(data || null);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load run details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRun();
  }, [orgSlug, runId]);

  useEffect(() => {
    const status = String(run?.status || "");
    const isActive = ["Pending", "Queued", "Running"].includes(status);
    if (!isActive) return;

    const timer = window.setInterval(() => {
      loadRun();
    }, 2500);

    return () => window.clearInterval(timer);
  }, [run?.status, orgSlug, runId]);

  const groupedResults = useMemo(() => {
    const results = Array.isArray(run?.results) ? run.results : [];
    const byFolder = new Map();

    results.forEach((result) => {
      const folderPath = result?.testCase?.folder?.path || "No Folder";
      if (!byFolder.has(folderPath)) byFolder.set(folderPath, []);
      byFolder.get(folderPath).push(result);
    });

    return Array.from(byFolder.entries())
      .map(([folderPath, resultsList]) => ({ folderPath, results: resultsList }))
      .sort((a, b) => a.folderPath.localeCompare(b.folderPath));
  }, [run]);

  const handleStopRun = async () => {
    if (!orgSlug || !runId) return;
    setSaving(true);
    try {
      await cancelRun(orgSlug, runId);
      await loadRun();
    } catch (err) {
      setError(err?.message || "Failed to stop run");
    } finally {
      setSaving(false);
    }
  };

  const handleRerunAll = async () => {
    if (!orgSlug || !runId) return;
    setSaving(true);
    try {
      await rerunRun(orgSlug, runId, {});
      await loadRun();
    } catch (err) {
      setError(err?.message || "Failed to rerun");
    } finally {
      setSaving(false);
    }
  };

  const canStop = ["Pending", "Queued", "Running"].includes(String(run?.status || ""));

  const loadActivities = async (markAsSeen = false) => {
    if (!orgSlug || !runId) return;
    setActivityLoading(true);
    try {
      const items = await listRunActivities(orgSlug, runId, { sort: "asc", limit: 100 });
      setActivityItems(Array.isArray(items) ? items : []);
      setActivityError("");

      const latestId = items.length > 0 ? String(items[items.length - 1].id || "") : "";
      if (latestId && (markAsSeen || activityOpen)) {
        setLastSeenActivityId(latestId);
        setActivityUnreadCount(0);
      }
    } catch (err) {
      setActivityError(err?.message || "Failed to load activity");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSendActivity = async () => {
    const message = activityDraft.trim();
    if (!message || !orgSlug || !runId) return;
    setActivitySending(true);
    try {
      await createRunActivity(orgSlug, runId, message);
      setActivityDraft("");
      await loadActivities(true);
    } catch (err) {
      setActivityError(err?.message || "Failed to post comment");
    } finally {
      setActivitySending(false);
    }
  };

  useEffect(() => {
    if (!orgSlug || !runId || activityOpen) return;

    let active = true;
    const watchLatest = async () => {
      try {
        const latest = await listRunActivities(orgSlug, runId, { sort: "desc", limit: 1 });
        if (!active) return;
        const latestId = latest?.[0]?.id ? String(latest[0].id) : "";
        if (!latestId) return;
        if (!lastSeenActivityId) {
          setLastSeenActivityId(latestId);
          return;
        }
        if (latestId !== lastSeenActivityId) {
          setActivityUnreadCount((count) => Math.min(99, count + 1));
        }
      } catch {
        // silent background refresh
      }
    };

    watchLatest();
    const timer = window.setInterval(watchLatest, 6000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [activityOpen, lastSeenActivityId, orgSlug, runId]);

  useEffect(() => {
    if (!activityOpen) return;
    loadActivities(true);

    const timer = window.setInterval(() => {
      loadActivities(false);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [activityOpen, orgSlug, runId]);

  useEffect(() => {
    if (!activityOpen || !activityEndRef.current) return;
    activityEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activityItems, activityOpen]);

  useEffect(() => {
    const shouldOpenActivity = searchParams.get("activity") === "1";
    if (shouldOpenActivity) {
      setActivityOpen(true);
    }
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${orgSlug}/execution/runs`)}
              className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold text-[#232323] dark:text-white">{run?.testPlan?.name || "Run"}</h1>
          </div>

          <div className="inline-flex items-center gap-2">
            {canStop ? (
              <button
                type="button"
                onClick={handleStopRun}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <Square className="h-4 w-4" />
                Stop Run
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setActivityOpen(true);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("activity", "1");
                  return next;
                });
              }}
              className="relative h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold inline-flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              Activity
              {activityUnreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFAA00] text-[#232323] text-[10px] font-bold leading-[18px] text-center">
                  {activityUnreadCount > 9 ? "9+" : activityUnreadCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          {loading ? (
            <div className="text-center py-8 text-sm text-[#232323]/60 dark:text-white/60">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FFAA00]" />
              Loading run details...
            </div>
          ) : !run ? (
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Run not found.</p>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 mb-4">
                {statusIcon(run.status)}
                <span className="text-2xl font-semibold text-[#232323] dark:text-white">{run.status}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Environment</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{run.environment || "-"}</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Total Tests</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{run.totalTests || 0}</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Results</p>
                  <p className="font-semibold text-green-600 mt-1">{run.passedTests || 0} passed</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Duration</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{run.duration ? `${Math.floor(run.duration / 1000)}s` : "-"}</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Triggered By</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{run.triggeredBy?.name || "-"}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {run ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-2xl font-semibold text-[#232323] dark:text-white">Test Case Results</p>
              <button
                type="button"
                onClick={handleRerunAll}
                disabled={saving}
                className="h-8 px-3 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" />
                Re-run All
              </button>
            </div>

            <div className="space-y-4">
              {groupedResults.map((group) => (
                <div key={group.folderPath} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#232323] dark:text-white">
                    <Folder className="h-4 w-4 text-[#FFAA00]" />
                    <span>{group.folderPath}</span>
                    <span className="text-xs font-medium text-[#232323]/45 dark:text-white/45">({group.results.length})</span>
                  </div>

                  <div className="space-y-2 pl-6">
                    {group.results.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setSelectedResultId(String(result.id));
                          setDetailsModalOpen(true);
                        }}
                        className="w-full text-left rounded-lg border border-black/10 dark:border-white/10 bg-background/80 px-3 py-2.5 hover:border-black/20 dark:hover:border-white/20 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-[#232323] dark:text-white truncate">{result.testCase?.title || "Test case"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#232323]/55 dark:text-white/55 inline-flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                {result.browser || "desktop-chrome"}
                              </span>
                            </div>
                          </div>

                          <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold ${resultStatusClass[result.status] || "bg-gray-100 text-gray-700"}`}>
                            {result.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <RunDetailsModal
          open={detailsModalOpen}
          orgSlug={orgSlug}
          runId={runId}
          initialResultId={selectedResultId}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedResultId("");
          }}
        />

        {activityOpen ? (
          <>
            <button
              type="button"
              aria-label="Close activity panel"
              onClick={() => {
                setActivityOpen(false);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("activity");
                  return next;
                });
              }}
              className="fixed inset-0 bg-black/40 z-40"
            />

            <aside className="fixed right-0 top-0 z-50 h-screen w-[min(460px,95vw)] border-l border-black/10 dark:border-white/10 bg-background shadow-2xl flex flex-col">
              <div className="h-14 px-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#232323] dark:text-white">Run Activity</p>
                  <p className="text-xs text-[#232323]/55 dark:text-white/55">Real-time collaboration for this execution run</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActivityOpen(false);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("activity");
                      return next;
                    });
                  }}
                  className="h-8 w-8 rounded-md border border-black/10 dark:border-white/15 inline-flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activityLoading && activityItems.length === 0 ? (
                  <div className="text-sm text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading activity...
                  </div>
                ) : null}

                {!activityLoading && activityItems.length === 0 ? (
                  <p className="text-sm text-[#232323]/60 dark:text-white/60">No activity yet. Start the conversation for this run.</p>
                ) : null}

                {activityItems.map((item) => {
                  const itemUserId = item?.user?.id ? String(item.user.id) : "";
                  const currentUserId = String(user?.userId || user?.id || "");
                  const isOwn = Boolean(itemUserId && currentUserId && itemUserId === currentUserId);

                  return (
                    <div key={item.id} className={`rounded-xl border px-3 py-2.5 ${isOwn ? "bg-[#FFAA00]/10 border-[#FFAA00]/30" : "bg-card/80 border-black/10 dark:border-white/10"}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-[#232323] dark:text-white truncate">{item?.user?.name || "Teammate"}</p>
                        <p className="text-[11px] text-[#232323]/50 dark:text-white/50 whitespace-nowrap">{formatActivityTime(item?.createdAt)}</p>
                      </div>
                      <p className="text-sm text-[#232323] dark:text-white whitespace-pre-wrap break-words">{item?.content || ""}</p>
                    </div>
                  );
                })}
                <div ref={activityEndRef} />
              </div>

              <div className="p-4 border-t border-black/10 dark:border-white/10">
                {activityError ? (
                  <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300 mb-3">
                    {activityError}
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  <MentionInput
                    value={activityDraft}
                    onChange={setActivityDraft}
                    organizationSlug={orgSlug}
                    rows={1}
                    disabled={activitySending}
                    placeholder="Comment, mention @everyone or tag teammates"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSendActivity();
                      }
                    }}
                    className="w-full min-h-[42px] max-h-36 resize-none rounded-lg border border-black/10 dark:border-white/15 bg-background px-3 py-2 text-sm text-[#232323] dark:text-white placeholder:text-[#232323]/45 dark:placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/40"
                  />

                  <button
                    type="button"
                    onClick={handleSendActivity}
                    disabled={activitySending || !activityDraft.trim()}
                    className="h-10 px-3 rounded-lg bg-[#FFAA00] text-[#232323] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {activitySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
