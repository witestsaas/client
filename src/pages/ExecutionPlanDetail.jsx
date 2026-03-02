import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, Folder, Loader2, Monitor, Play, Plus, Search, Smartphone, Sparkles, X, XCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { addPlanTestCases, getExecutionSlots, getPlan, getRun, runPlan } from "../services/executionReporting";
import { fetchProjectTree } from "../services/testManagement";

const DESKTOP_PROFILES = [
  { id: "desktop-chrome", label: "Google Chrome (Desktop)", osIcon: "/os_browsers_icons/windowsOS.svg", browserIcon: "/os_browsers_icons/chrome.svg" },
  { id: "desktop-edge", label: "Microsoft Edge (Desktop)", osIcon: "/os_browsers_icons/windowsOS.svg", browserIcon: "/os_browsers_icons/msEdge.svg" },
  { id: "desktop-firefox", label: "Firefox (Desktop)", osIcon: "/os_browsers_icons/windowsOS.svg", browserIcon: "/os_browsers_icons/firefox.svg" },
  { id: "desktop-safari", label: "Safari (Desktop)", osIcon: "/os_browsers_icons/macOS.svg", browserIcon: "/os_browsers_icons/safari.svg" },
];

const MOBILE_PROFILES = [
  { id: "mobile-samsung-s24-ultra", label: "Samsung Galaxy S24 Ultra", osIcon: "/os_browsers_icons/androidOS.svg", browserIcon: "/os_browsers_icons/chrome.svg" },
  { id: "mobile-iphone-15-pro-max", label: "iPhone 15 Pro Max", osIcon: "/os_browsers_icons/iOS.svg", browserIcon: "/os_browsers_icons/safari.svg" },
];

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Passed: "bg-green-500 text-white",
  Completed: "bg-green-500 text-white",
  Running: "bg-blue-100 text-blue-700",
  Queued: "bg-blue-50 text-blue-600",
  Pending: "bg-gray-100 text-gray-700",
  Draft: "bg-gray-100 text-gray-700",
  InReview: "bg-yellow-100 text-yellow-700",
  Outdated: "bg-orange-100 text-orange-700",
  Rejected: "bg-red-100 text-red-700",
  Failed: "bg-red-500 text-white",
  Error: "bg-red-500 text-white",
  Cancelled: "bg-gray-200 text-gray-700",
  Aborted: "bg-gray-200 text-gray-700",
};

const normalizeStatus = (rawStatus) => {
  const value = String(rawStatus || "Draft").trim();
  if (value.toLowerCase() === "inreview" || value.toLowerCase() === "in_review") return "InReview";
  if (value.toLowerCase() === "outdated") return "Outdated";
  if (value.toLowerCase() === "active") return "Active";
  if (value.toLowerCase() === "passed") return "Passed";
  if (value.toLowerCase() === "rejected") return "Rejected";
  if (value.toLowerCase() === "failed") return "Failed";
  return "Draft";
};

const statusIcon = (status) => {
  if (status === "Passed" || status === "Completed") {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
  if (status === "Failed" || status === "Error") {
    return <XCircle className="h-3.5 w-3.5" />;
  }
  return null;
};

function AddTestCasesModal({ open, onClose, treeRows, existingIds, onSubmit, saving }) {
  const [search, setSearch] = useState("");
  const [step, setStep] = useState("select");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [browserConfig, setBrowserConfig] = useState({});

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setStep("select");
    setError("");
    setSelectedIds([]);
    setBrowserConfig({});
  }, [open]);

  if (!open) return null;

  const existingSet = new Set((existingIds || []).map((item) => String(item)));

  const rows = treeRows.filter((item) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return item.folderName.toLowerCase().includes(term) || item.testCases.some((tc) => tc.title.toLowerCase().includes(term));
  });

  const selectedDetails = treeRows
    .flatMap((row) => row.testCases)
    .filter((testCase) => selectedIds.includes(String(testCase.id)));

  const toggleCase = (id, checked) => {
    const normalizedId = String(id);
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(normalizedId)) return prev;
        return [...prev, normalizedId];
      }
      return prev.filter((item) => item !== normalizedId);
    });
    setError("");
  };

  const proceedToConfigure = () => {
    if (selectedIds.length === 0) return;
    const defaults = {};
    selectedIds.forEach((id) => {
      defaults[id] = browserConfig[id]?.length ? browserConfig[id] : ["desktop-chrome"];
    });
    setBrowserConfig(defaults);
    setStep("configure");
    setError("");
  };

  const renderBrowserSelector = (testCaseId) => {
    const selected = Array.isArray(browserConfig[testCaseId]) ? browserConfig[testCaseId] : [];
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[...DESKTOP_PROFILES, ...MOBILE_PROFILES].map((profile) => {
            const active = selected.includes(profile.id);
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => toggleBrowser(testCaseId, profile.id, !active)}
                className={`group relative flex items-center gap-2.5 p-3 rounded-lg border transition-all hover:shadow-sm ${
                  active
                    ? "border-[#FFAA00] bg-[#FFAA00]/5 shadow-sm ring-1 ring-[#FFAA00]/20"
                    : "border-black/10 dark:border-white/15 hover:border-black/20 dark:hover:border-white/25 bg-background/90"
                }`}
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <img src={profile.osIcon} alt="" className="w-4 h-4 object-contain" />
                  <img src={profile.browserIcon} alt="" className="w-4 h-4 object-contain" />
                </div>
                <span className={`text-xs font-medium truncate ${active ? "text-[#FFAA00]" : "text-[#232323]/70 dark:text-white/70"}`}>
                  {profile.label}
                </span>

                {active ? (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFAA00] rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {selected.length > 0 ? (
          <div className="flex items-center gap-2 text-xs text-[#232323]/60 dark:text-white/60">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
            </div>
            <span>{selected.length} browser{selected.length !== 1 ? "s" : ""} selected</span>
          </div>
        ) : null}
      </div>
    );
  };

  const applyBrowsersToAll = (profiles) => {
    const next = {};
    selectedIds.forEach((id) => {
      next[id] = [...profiles];
    });
    setBrowserConfig(next);
    setError("");
  };

  const toggleBrowser = (testCaseId, browserId, checked) => {
    setBrowserConfig((prev) => {
      const current = Array.isArray(prev[testCaseId]) ? prev[testCaseId] : [];
      let next;
      if (checked) {
        next = current.includes(browserId) ? current : [...current, browserId];
      } else {
        next = current.filter((id) => id !== browserId);
      }
      return { ...prev, [testCaseId]: next };
    });
    setError("");
  };

  const submitWithBrowsers = () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one test case.");
      setStep("select");
      return;
    }
    const hasEmptyConfig = selectedIds.some((id) => !Array.isArray(browserConfig[id]) || browserConfig[id].length === 0);
    if (hasEmptyConfig) {
      setError("Please select at least one browser for every selected test case.");
      return;
    }
    const payload = selectedIds.map((id) => ({ testCaseId: id, browsers: browserConfig[id] || [] }));
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-[90vw] sm:max-w-[1200px] w-[1200px] max-h-[90vh] flex flex-col rounded-3xl border border-black/10 dark:border-white/10 bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-background/25 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-[#232323] dark:text-white">{step === "select" ? "Add Test Cases" : "Configure Browsers"}</p>
            <p className="text-xs text-[#232323]/55 dark:text-white/55 mt-0.5">
              {step === "select" ? "Step 1 of 2: Select test cases" : "Select which browsers each test case should run on"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-md inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70dvh] overflow-auto">
          {step === "select" ? (
            <>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#232323]/40 dark:text-white/40" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search test cases..."
                  className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
                />
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-background/60 shadow-sm divide-y divide-black/10 dark:divide-white/10">
                {rows.length === 0 ? (
                  <p className="p-4 text-sm text-[#232323]/60 dark:text-white/60">No test cases found.</p>
                ) : (
                  rows.map((row) => {
                    const selectable = row.testCases.filter((tc) => !existingSet.has(String(tc.id)));
                    const folderSelectedCount = selectable.filter((tc) => selectedIds.includes(String(tc.id))).length;
                    const allSelected = selectable.length > 0 && folderSelectedCount === selectable.length;
                    return (
                      <div key={row.folderId || row.folderName} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#232323] dark:text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              disabled={selectable.length === 0}
                              onChange={() => {
                                selectable.forEach((tc) => toggleCase(String(tc.id), !allSelected));
                              }}
                            />
                            <Folder className="h-4 w-4 text-[#FFAA00]" />
                            {row.folderName} ({row.testCases.length})
                          </label>
                          <span className="text-xs text-[#232323]/55 dark:text-white/55">{folderSelectedCount} selected</span>
                        </div>
                        <div className="space-y-1.5 pl-7">
                          {row.testCases.map((tc) => {
                            const testCaseId = String(tc.id);
                            const alreadyInPlan = existingSet.has(testCaseId);
                            return (
                              <label key={tc.id} className={`flex items-center justify-between gap-2 text-sm ${alreadyInPlan ? "opacity-60" : "cursor-pointer"}`}>
                                <span className="inline-flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    disabled={alreadyInPlan}
                                    checked={selectedIds.includes(testCaseId)}
                                    onChange={(event) => toggleCase(testCaseId, event.target.checked)}
                                  />
                                  <span className="truncate text-[#232323] dark:text-white">{tc.title}</span>
                                </span>
                                <span className="text-[11px] text-[#232323]/50 dark:text-white/50">{alreadyInPlan ? "Already in plan" : tc.status || "Draft"}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FFAA00]/10 rounded-lg flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-[#FFAA00]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#232323] dark:text-white">Configure Browser Testing</h3>
                    <p className="text-sm text-[#232323]/55 dark:text-white/55">Select which browsers each test case should run on for comprehensive coverage.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-background/70 to-background/95 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#FFAA00]/20 rounded-md flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#FFAA00]" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#232323] dark:text-white">Quick Apply to All</h4>
                </div>
                <p className="text-xs text-[#232323]/55 dark:text-white/55 mb-4">Save time by applying the same browser configuration to all selected test cases</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyBrowsersToAll(["desktop-chrome"])} className="h-8 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 text-xs font-semibold inline-flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" /> Chrome Only
                  </button>
                  <button type="button" onClick={() => applyBrowsersToAll(DESKTOP_PROFILES.map((p) => p.id))} className="h-8 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 text-xs font-semibold inline-flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" /> All Desktop
                  </button>
                  <button type="button" onClick={() => applyBrowsersToAll(MOBILE_PROFILES.map((p) => p.id))} className="h-8 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 text-xs font-semibold inline-flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> All Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBrowsersToAll([...DESKTOP_PROFILES.map((p) => p.id), ...MOBILE_PROFILES.map((p) => p.id)])}
                    className="h-8 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <Smartphone className="h-3.5 w-3.5" />
                    All browsers
                  </button>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto">
                {selectedDetails.map((testCase, index) => {
                  const testCaseId = String(testCase.id);
                  const selectedBrowsers = Array.isArray(browserConfig[testCaseId]) ? browserConfig[testCaseId] : [];
                  const statusKey = normalizeStatus(testCase.status);
                  return (
                    <div key={testCaseId} className="rounded-xl border border-black/10 dark:border-white/10 bg-background/90 shadow-sm p-4 space-y-3 hover:border-black/20 dark:hover:border-white/25 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-medium text-[#232323] dark:text-white truncate">{testCase.title}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#232323]/55 dark:text-white/55">Test Case {index + 1} of {selectedDetails.length}</span>
                              <div className="w-1 h-1 bg-[#232323]/20 dark:bg-white/20 rounded-full" />
                              <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ${statusColors[statusKey] || statusColors.Draft}`}>
                                {statusKey}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3.5 h-3.5 text-[#232323]/55 dark:text-white/55" />
                          <span className="text-sm font-medium text-[#232323]/80 dark:text-white/80">Browser Configuration</span>
                          <div className="h-px bg-black/10 dark:bg-white/15 flex-1" />
                        </div>
                        {renderBrowserSelector(testCaseId)}
                      </div>

                      {selectedBrowsers.length === 0 ? (
                        <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-500 inline-flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" /> Select at least one browser
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="px-5 pb-2">
            <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</div>
          </div>
        ) : null}

        <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 bg-background/20 flex items-center justify-between">
          {step === "select" ? (
            <>
              <span className="text-xs text-[#232323]/55 dark:text-white/55">{selectedIds.length} selected</span>
              <div className="inline-flex items-center gap-2">
                <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-xs font-semibold">Cancel</button>
                <button
                  type="button"
                  onClick={proceedToConfigure}
                  disabled={selectedIds.length === 0}
                  className="h-9 px-4 rounded-lg bg-[#FFAA00] text-[#232323] text-xs font-semibold shadow-sm disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  Next: Configure Browsers
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-[#232323]/55 dark:text-white/55 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFAA00]" />
                Configure browsers for {selectedDetails.length} test case{selectedDetails.length !== 1 ? "s" : ""}
              </span>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  disabled={saving}
                  className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitWithBrowsers}
                  disabled={saving || selectedIds.length === 0 || selectedIds.some((id) => !Array.isArray(browserConfig[id]) || browserConfig[id].length === 0)}
                  className="h-9 px-4 min-w-[170px] rounded-lg bg-[#FFAA00] text-[#232323] text-xs font-semibold shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add {selectedIds.length} Test Case{selectedIds.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RunPlanModal({ open, onClose, plan, onRun }) {
  const { orgSlug } = useParams();
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [running, setRunning] = useState(false);
  const [parallelSessions, setParallelSessions] = useState(1);
  const [slots, setSlots] = useState({ maxPerOrg: 4, orgAvailable: 4, orgRunning: 0, orgQueued: 0 });

  useEffect(() => {
    if (!open || !orgSlug) return;
    let cancelled = false;
    setLoadingSlots(true);
    getExecutionSlots(orgSlug)
      .then((data) => {
        if (cancelled) return;
        const maxPerOrg = Number(data?.maxPerOrg || 4);
        const orgAvailable = Number(data?.orgAvailable ?? maxPerOrg);
        setSlots({
          maxPerOrg,
          orgAvailable,
          orgRunning: Number(data?.orgRunning || 0),
          orgQueued: Number(data?.orgQueued || 0),
        });
        const defaultParallel = Math.min(Math.max(orgAvailable || 1, 1), 4);
        setParallelSessions(defaultParallel);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots({ maxPerOrg: 4, orgAvailable: 4, orgRunning: 0, orgQueued: 0 });
        setParallelSessions(4);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, orgSlug]);

  if (!open || !plan) return null;

  const testCases = Array.isArray(plan?.testCases) ? plan.testCases : [];
  const totalExecutions = testCases.reduce((sum, item) => sum + (Array.isArray(item?.browsers) ? item.browsers.length : 0), 0);
  const batches = parallelSessions > 0 ? Math.ceil(Math.max(totalExecutions, 1) / parallelSessions) : 1;

  const browserCounts = {};
  testCases.forEach((item) => {
    const browsers = Array.isArray(item?.browsers) ? item.browsers : [];
    browsers.forEach((browserId) => {
      browserCounts[browserId] = (browserCounts[browserId] || 0) + 1;
    });
  });

  const browserProfiles = [...DESKTOP_PROFILES, ...MOBILE_PROFILES];
  const selectedBrowserCounts = Object.entries(browserCounts)
    .map(([id, count]) => {
      const profile = browserProfiles.find((p) => p.id === id);
      return profile ? { profile, count } : null;
    })
    .filter(Boolean);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await onRun({ parallelSessions });
      onClose();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        <div className="px-5 py-4">
          <h3 className="text-3xl leading-none font-semibold text-[#232323] dark:text-white">Run "{plan.name || "Plan"}"</h3>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60">Environment</p>
            <p className="text-base font-semibold text-[#232323] dark:text-white mt-1">{plan.environment || "staging"}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Execution Summary</p>
            <div className="mt-2 rounded-xl border border-black/10 dark:border-white/10 bg-background/70 p-3">
              <p className="text-sm text-[#232323]/75 dark:text-white/75">{testCases.length} test case{testCases.length !== 1 ? "s" : ""} will run on their configured browsers</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedBrowserCounts.length ? (
                  selectedBrowserCounts.map(({ profile, count }) => (
                    <span key={profile.id} className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/15 bg-background px-1.5 py-0.5 text-xs text-[#232323]/70 dark:text-white/70">
                      <img src={profile.osIcon} alt="" className="h-3.5 w-3.5" />
                      <img src={profile.browserIcon} alt="" className="h-3.5 w-3.5" />
                      ×{count}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#232323]/45 dark:text-white/45">No configured browsers yet</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60">Slot Availability</p>
            <div className="mt-2 rounded-xl border border-black/10 dark:border-white/10 bg-background/70 p-3 flex items-center justify-between">
              <span className="text-sm text-[#232323]/75 dark:text-white/75">Available slots</span>
              {loadingSlots ? (
                <span className="text-xs text-[#232323]/60 dark:text-white/60 inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />...</span>
              ) : (
                <span className="text-sm font-semibold">
                  <span className="text-green-600">{slots.orgAvailable}</span>
                  <span className="text-[#232323]/45 dark:text-white/45"> / {slots.maxPerOrg}</span>
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60">Parallel Sessions</p>
            <p className="text-xs text-[#232323]/45 dark:text-white/45 mt-1">How many tests to run simultaneously (max 4 per organization)</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="4"
                value={parallelSessions}
                onChange={(event) => setParallelSessions(Math.min(Math.max(Number(event.target.value) || 1, 1), 4))}
                className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-5 text-center text-sm font-semibold text-[#232323] dark:text-white">{parallelSessions}</span>
            </div>
            <p className="text-xs text-[#232323]/45 dark:text-white/45 mt-2">Up to {parallelSessions} browser sessions will run at once</p>
          </div>

          <div className="rounded-xl border border-[#FFAA00]/20 bg-[#FFAA00]/10 p-3">
            <p className="text-sm font-semibold text-[#232323] dark:text-white"><span className="text-[#FFAA00]">{totalExecutions}</span> total executions</p>
            <p className="text-xs text-[#232323]/55 dark:text-white/55 mt-1">⏱️ {batches} batch{batches !== 1 ? "es" : ""} will run sequentially</p>
          </div>
        </div>

        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRunNow}
            disabled={running || totalExecutions === 0}
            className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExecutionPlanDetail() {
  const { orgSlug, planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [treeRows, setTreeRows] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [activeRunId, setActiveRunId] = useState("");
  const [activeRun, setActiveRun] = useState(null);

  const loadPlan = async () => {
    if (!orgSlug || !planId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getPlan(orgSlug, planId);
      setPlan(data || null);

      const projectId = data?.projectId || data?.project?.id;
      if (projectId) {
        const tree = await fetchProjectTree(orgSlug, projectId);
        const folders = Array.isArray(tree?.folders) ? tree.folders : [];
        const testCases = Array.isArray(tree?.testCases) ? tree.testCases : [];
        const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
        const grouped = new Map();

        testCases.forEach((tc) => {
          const folder = folderMap.get(tc.folderId);
          const key = tc.folderId || "root";
          if (!grouped.has(key)) {
            grouped.set(key, {
              folderId: key,
              folderName: folder?.path || folder?.name || "Root",
              testCases: [],
            });
          }
          grouped.get(key).testCases.push(tc);
        });

        const rows = Array.from(grouped.values()).sort((a, b) => a.folderName.localeCompare(b.folderName));
        setTreeRows(rows);
      } else {
        setTreeRows([]);
      }
    } catch (err) {
      setError(err?.message || "Failed to load plan");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [orgSlug, planId]);

  const selectedCurrentIds = useMemo(() => {
    return Array.isArray(plan?.testCases) ? plan.testCases.map((item) => String(item.testCase?.id || item.id)) : [];
  }, [plan]);

  const groupedPlanCases = useMemo(() => {
    const items = Array.isArray(plan?.testCases) ? plan.testCases : [];
    const groups = new Map();

    items.forEach((item) => {
      const folderPath = item?.testCase?.folder?.path || item?.testCase?.folderPath || "No Folder";
      if (!groups.has(folderPath)) {
        groups.set(folderPath, []);
      }
      groups.get(folderPath).push(item);
    });

    return Array.from(groups.entries())
      .map(([folderPath, entries]) => ({ folderPath, entries }))
      .sort((a, b) => a.folderPath.localeCompare(b.folderPath));
  }, [plan]);

  const runStatusByCase = useMemo(() => {
    const map = new Map();
    const browserStatusMap = new Map();
    const results = Array.isArray(activeRun?.results) ? activeRun.results : [];

    const normalizeRunStatus = (value) => {
      const text = String(value || "").toLowerCase();
      if (text === "running") return "Running";
      if (text === "queued") return "Queued";
      if (text === "pending") return "Pending";
      if (text === "passed" || text === "completed") return "Passed";
      if (text === "failed") return "Failed";
      if (text === "error") return "Error";
      if (text === "cancelled" || text === "aborted" || text === "canceled") return "Cancelled";
      return "Pending";
    };

    const byCase = new Map();
    results.forEach((result) => {
      const testCaseId = String(result?.testCase?.id || "");
      const browserId = String(result?.browser || "");
      if (!testCaseId || !browserId) return;
      const status = normalizeRunStatus(result?.status);

      if (!byCase.has(testCaseId)) byCase.set(testCaseId, []);
      byCase.get(testCaseId).push(status);
      browserStatusMap.set(`${testCaseId}:${browserId}`, status);
    });

    byCase.forEach((statuses, caseId) => {
      if (statuses.some((s) => s === "Running")) {
        map.set(caseId, "Running");
      } else if (statuses.some((s) => s === "Queued" || s === "Pending")) {
        map.set(caseId, "Queued");
      } else if (statuses.some((s) => s === "Failed" || s === "Error")) {
        map.set(caseId, "Failed");
      } else if (statuses.every((s) => s === "Passed" || s === "Cancelled")) {
        map.set(caseId, "Passed");
      }
    });

    return { caseStatusMap: map, browserStatusMap };
  }, [activeRun]);

  useEffect(() => {
    if (!orgSlug || !activeRunId) return undefined;

    let cancelled = false;
    let timer = null;

    const pollRun = async () => {
      try {
        const run = await getRun(orgSlug, activeRunId);
        if (cancelled) return;
        setActiveRun(run || null);

        const status = String(run?.status || "").toLowerCase();
        const isFinished = ["completed", "failed", "error", "aborted", "cancelled"].includes(status);
        if (!isFinished) {
          timer = window.setTimeout(pollRun, 2500);
        }
      } catch {
        if (!cancelled) {
          timer = window.setTimeout(pollRun, 3500);
        }
      }
    };

    pollRun();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orgSlug, activeRunId]);

  const submitAddCases = async (testCasesPayload) => {
    setSaving(true);
    setError("");
    try {
      if (Array.isArray(testCasesPayload) && testCasesPayload.length > 0) {
        await addPlanTestCases(orgSlug, planId, { testCases: testCasesPayload });
      }
      setAddModalOpen(false);
      await loadPlan();
    } catch (err) {
      setError(err?.message || "Failed to add test cases");
    } finally {
      setSaving(false);
    }
  };

  const handleRunPlan = async (payload = {}) => {
    setSaving(true);
    setError("");
    try {
      const result = await runPlan(orgSlug, planId, payload);
      const runId = result?.testRun?.id || "";
      if (runId) {
        setActiveRunId(runId);
      }
      await loadPlan();
      return result;
    } catch (err) {
      setError(err?.message || "Failed to run plan");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-0 bg-transparent overflow-hidden">
        <div className="border-b border-black/10 dark:border-white/10 bg-card/95 px-6 py-4 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${orgSlug}/execution/plans`)}
              className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold text-[#232323] dark:text-white">{plan?.name || "Plan"}</h1>
          </div>

          <button
            type="button"
            onClick={() => setRunModalOpen(true)}
            disabled={loading || !plan || saving}
            className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            Run Plan
          </button>
        </div>

        {error ? <div className="mx-6 mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div> : null}

        {loading ? (
          <div className="p-4">
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Loading plan details...</p>
          </div>
        ) : !plan ? (
          <div className="p-4">
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Plan not found.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Project</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{plan.project?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Environment</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{plan.environment || "-"}</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Test Cases</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{Array.isArray(plan.testCases) ? plan.testCases.length : 0}</p>
                </div>
                <div>
                  <p className="text-[#232323]/50 dark:text-white/50 text-xs">Last Updated</p>
                  <p className="font-semibold text-[#232323] dark:text-white mt-1">{plan.updatedAt ? new Date(plan.updatedAt).toLocaleString() : "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-background/60 shadow-sm p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-lg font-semibold text-[#232323] dark:text-white">Test Cases</p>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/80 inline-flex items-center gap-2 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Test Cases
                </button>
              </div>

              {!Array.isArray(plan.testCases) || plan.testCases.length === 0 ? (
                <p className="text-sm text-[#232323]/60 dark:text-white/60">No test cases in this plan.</p>
              ) : (
                <div className="space-y-4">
                  {activeRun ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-background/75 px-3 py-2 text-xs text-[#232323]/70 dark:text-white/70 inline-flex items-center gap-2">
                      <span className="font-semibold">Run status:</span>
                      <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ${statusColors[normalizeStatus(activeRun.status)] || statusColors.Pending}`}>
                        {statusIcon(normalizeStatus(activeRun.status))}
                        {statusIcon(normalizeStatus(activeRun.status)) ? <span className="w-1" /> : null}
                        {String(activeRun.status || "Pending")}
                      </span>
                      <span>{activeRun.passedTests || 0}/{activeRun.totalTests || 0} passed</span>
                    </div>
                  ) : null}

                  {groupedPlanCases.map((group) => (
                    <div key={group.folderPath} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#232323] dark:text-white">
                        <Folder className="h-4 w-4 text-[#FFAA00]" />
                        <span>{group.folderPath}</span>
                        <span className="text-xs font-medium text-[#232323]/45 dark:text-white/45">({group.entries.length})</span>
                      </div>

                      <div className="space-y-2 pl-6">
                        {group.entries.map((item) => {
                          const caseId = String(item?.testCase?.id || "");
                          const liveStatus = runStatusByCase.caseStatusMap.get(caseId);
                          const statusKey = liveStatus || normalizeStatus(item?.testCase?.status || "Draft");
                          const browsers = Array.isArray(item?.browsers) ? item.browsers : [];
                          const browserProfiles = [...DESKTOP_PROFILES, ...MOBILE_PROFILES].filter((profile) => browsers.includes(profile.id));

                          return (
                            <div key={item.id} className="rounded-lg border border-black/10 dark:border-white/10 bg-background/80 px-3 py-2.5 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-[#232323] dark:text-white truncate">{item.testCase?.title || "Test case"}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {browserProfiles.length > 0 ? (
                                      browserProfiles.map((profile) => {
                                        const browserStatus = runStatusByCase.browserStatusMap.get(`${caseId}:${profile.id}`);
                                        return (
                                        <span key={`${item.id}-${profile.id}`} className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/15 bg-background px-1.5 py-0.5 text-[11px] text-[#232323]/65 dark:text-white/65">
                                          <img src={profile.osIcon} alt="" className="h-3 w-3" />
                                          <img src={profile.browserIcon} alt="" className="h-3 w-3" />
                                          {browserStatus ? <span className="opacity-80">{browserStatus === "Passed" ? "✓" : browserStatus === "Failed" ? "✕" : "•"}</span> : null}
                                        </span>
                                      )})
                                    ) : (
                                      <span className="text-[11px] text-[#232323]/45 dark:text-white/45">No browser config</span>
                                    )}
                                  </div>
                                </div>

                                <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ${statusColors[statusKey] || statusColors.Draft}`}>
                                  {statusIcon(statusKey)}
                                  {statusIcon(statusKey) ? <span className="w-1" /> : null}
                                  {statusKey}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <AddTestCasesModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          treeRows={treeRows}
          existingIds={selectedCurrentIds}
          onSubmit={submitAddCases}
          saving={saving}
        />

        <RunPlanModal
          open={runModalOpen}
          onClose={() => setRunModalOpen(false)}
          plan={plan}
          onRun={handleRunPlan}
        />
      </div>
    </DashboardLayout>
  );
}
