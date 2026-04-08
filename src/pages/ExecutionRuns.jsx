import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink, Eye, FileText, Filter, Folder, Globe2, Loader2, MoreVertical, Play, Search, Square, TerminalSquare, Trash2, Video, X, XCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchTestProjects } from "../services/testManagement";
import { cancelRun, deleteRun, getResultArtifacts, getRun, getRunResultLogs, listRuns, rerunRun, rerunRunResult } from "../services/executionReporting";
import { useTestRunGlobalUpdates, useTestRunSocket, useOrgSlots } from "../hooks/useSocket";

function formatRelativeTime(dateString) {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(ms) {
  if (!ms) return "-";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${seconds}s`;
}

function statusBadge(status) {
  const normalized = String(status || "Pending");
  if (normalized === "Completed" || normalized === "Passed") {
    return <span className="inline-flex items-center h-6 px-2 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{normalized}</span>;
  }
  if (normalized === "Failed") {
    return <span className="inline-flex items-center h-6 px-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold"><XCircle className="h-3.5 w-3.5 mr-1" />Failed</span>;
  }
  if (normalized === "Running") {
    return <span className="inline-flex items-center h-6 px-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold"><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Running</span>;
  }
  if (normalized === "Queued") {
    return <span className="inline-flex items-center h-6 px-2 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold"><Clock className="h-3.5 w-3.5 mr-1" />Queued</span>;
  }
  return <span className="inline-flex items-center h-6 px-2 rounded-md bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-xs font-semibold"><Clock className="h-3.5 w-3.5 mr-1" />{normalized}</span>;
}

function resolveRunId(run) {
  return run?.id || run?.runId || run?.testRunId || run?.test_run_id || "";
}

function normalizeRunResults(run) {
  if (!run || typeof run !== "object") return [];
  const candidates = [
    run?.results,
    run?.testResults,
    run?.testRunResults,
    run?.executionResults,
    run?.items,
  ];
  const firstArray = candidates.find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? firstArray : [];
}

function isActiveRunStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "pending" || normalized === "queued" || normalized === "running";
}

function isStoppedRunStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized === "aborted" || normalized === "cancelled" || normalized === "canceled" || normalized === "stopped";
}

function normalizeStepKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/["'`]/g, "")
    .trim();
}

function tokenizeMatchText(value) {
  const raw = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return raw
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function normalizeLogLines(logs) {
  const source = Array.isArray(logs)
    ? logs
    : Array.isArray(logs?.logs)
      ? logs.logs
      : [];
  return source.map((entry) => {
    if (typeof entry === "string") {
      return { type: "log", message: entry, timestamp: "" };
    }
    return {
      type: String(entry?.type || "log"),
      message: String(entry?.message || entry?.text || JSON.stringify(entry)),
      timestamp: String(entry?.timestamp || ""),
    };
  });
}

function toArtifactUrl(value) {
  if (!value) return "";
  const normalized = String(value);
  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("/uploads/")) {
    return normalized;
  }
  return `/uploads/${normalized.replace(/^\/+/, "")}`;
}

function buildMinioPublicUrl(value) {
  const key = String(value || "").replace(/^\/+/, "");
  if (!key) return "";
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const host = window.location.hostname || "localhost";
  return `${protocol}://${host}:8000/test-artifacts/${key}`;
}

function collectArtifactStringValues(value, depth = 0) {
  if (!value || depth > 4) return [];
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectArtifactStringValues(item, depth + 1));
  }
  if (typeof value === "object") {
    const objectValue = value || {};
    const preferredKeys = [
      "url",
      "path",
      "key",
      "s3Key",
      "publicUrl",
      "screenshot",
      "screenshotUrl",
      "screenshotPath",
      "value",
    ];

    const collected = preferredKeys.flatMap((key) => collectArtifactStringValues(objectValue[key], depth + 1));
    if (collected.length > 0) {
      return collected;
    }

    return Object.values(objectValue).flatMap((item) => collectArtifactStringValues(item, depth + 1));
  }
  return [];
}

function buildArtifactUrlCandidates(value) {
  if (!value) return [];
  const candidates = [];
  const values = collectArtifactStringValues(value);

  values.forEach((normalized) => {
    if (!normalized) return;

    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      candidates.push(normalized);
      // Extract the /test-artifacts/ path for same-origin fallback
      const testArtifactsMatch = normalized.match(/\/test-artifacts\/.+/);
      if (testArtifactsMatch) {
        candidates.push(testArtifactsMatch[0]);
      }
      return;
    }

    if (normalized.startsWith("/uploads/")) {
      const asKey = normalized.replace(/^\/uploads\//, "");
      // Prefer S3/MinIO over local filesystem
      candidates.push(`/test-artifacts/${asKey}`);
      const minio = buildMinioPublicUrl(asKey);
      if (minio) candidates.push(minio);
      candidates.push(normalized);
      return;
    }

    // Raw S3 key — try MinIO / test-artifacts first, /uploads last
    const clean = normalized.replace(/^\/+/, "");
    candidates.push(`/test-artifacts/${clean}`);
    const minio = buildMinioPublicUrl(normalized);
    if (minio) candidates.push(minio);
    candidates.push(`/uploads/${clean}`);
  });

  return Array.from(new Set(candidates.filter(Boolean)));
}

function ArtifactImage({ candidates, alt, className, onResolved }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeUrl = Array.isArray(candidates) ? candidates[currentIndex] : "";

  if (!activeUrl) {
    return <div className="w-full h-full bg-muted text-xs text-[#232323]/55 dark:text-white/55 flex items-center justify-center">Image unavailable</div>;
  }

  return (
    <img
      src={activeUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onLoad={() => {
        if (typeof onResolved === "function" && activeUrl) {
          onResolved(activeUrl);
        }
      }}
      onError={() => {
        setCurrentIndex((prev) => {
          if (!Array.isArray(candidates)) return prev;
          return prev < candidates.length - 1 ? prev + 1 : prev;
        });
      }}
    />
  );
}

export function RunDetailsModal({ open, orgSlug, runId, onClose, initialResultId = "" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState(null);
  const [activeResultId, setActiveResultId] = useState("");
  const [activeTab, setActiveTab] = useState("steps");
  const [logsByResult, setLogsByResult] = useState({});
  const [resultPayloadById, setResultPayloadById] = useState({});
  const [artifactsByResult, setArtifactsByResult] = useState({});
  const [networkByResult, setNetworkByResult] = useState({});
  const [resolvedScreenshotUrlByKey, setResolvedScreenshotUrlByKey] = useState({});
  const [liveObservationsByResult, setLiveObservationsByResult] = useState({});
  const [rerunModalOpen, setRerunModalOpen] = useState(false);
  const [rerunMode, setRerunMode] = useState("all");
  const [parallelSessions, setParallelSessions] = useState(1);
  const [rerunning, setRerunning] = useState(false);
  const lastResultsByRunRef = useRef(new Map());

  useEffect(() => {
    if (!open) {
      setRun(null);
      setError("");
      setLoading(false);
      setActiveResultId("");
      setActiveTab("steps");
      setResolvedScreenshotUrlByKey({});
      setLiveObservationsByResult({});
    }
  }, [open]);

  useEffect(() => {
    if (!open || !orgSlug || !runId) return;
    let cancelled = false;

    const load = async (first = false) => {
      if (first) setLoading(true);
      try {
        const data = await getRun(orgSlug, runId);
        if (cancelled) return;
        const nextRun = data || null;
        const fetchedResults = normalizeRunResults(nextRun);
        const runKey = String(runId || "");
        if (runKey && fetchedResults.length > 0) {
          lastResultsByRunRef.current.set(runKey, fetchedResults);
        }
        const cachedResults = runKey ? (lastResultsByRunRef.current.get(runKey) || []) : [];
        const mergedRun = nextRun
          ? {
              ...nextRun,
              results: fetchedResults.length > 0 ? fetchedResults : cachedResults,
            }
          : nextRun;

        setRun(mergedRun);
        setActiveResultId((prev) => {
          const currentId = String(prev || "");
          const preferredId = String(initialResultId || "");
          const availableResults = normalizeRunResults(mergedRun);
          const resultIds = Array.isArray(availableResults)
            ? availableResults.map((result) => String(result?.id || "")).filter(Boolean)
            : [];

          if (preferredId && resultIds.includes(preferredId)) {
            return preferredId;
          }

          if (currentId && resultIds.includes(currentId)) {
            return currentId;
          }

          return resultIds[0] || currentId;
        });
        setError("");
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load run details");
      } finally {
        if (!cancelled && first) setLoading(false);
      }
    };

    load(true);
    const timer = window.setInterval(() => {
      load(false);
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, orgSlug, runId, initialResultId]);

  const results = normalizeRunResults(run);
  const selectedResult = results.find((result) => String(result?.id) === String(activeResultId)) || results[0] || null;

  useTestRunSocket(open && runId ? runId : null, {
    onLiveEvent: (event) => {
      if (!open) return;

      const eventType = String(event?.type || "");
      const eventData = event?.data || {};
      const eventTestCaseId = String(event?.testCaseId || "").trim();
      const eventBrowser = String(event?.browser || "").trim().toLowerCase();

      const targetResult = results.find((item) => {
        const caseMatches = eventTestCaseId
          ? String(item?.testCaseId || item?.testCase?.id || "") === eventTestCaseId
          : true;
        const browserMatches = eventBrowser
          ? String(item?.browser || "").trim().toLowerCase() === eventBrowser
          : true;
        return caseMatches && browserMatches;
      }) || selectedResult;

      const targetResultId = String(targetResult?.id || "");
      if (!targetResultId) return;

      const actionName = String(eventData?.actionName || eventData?.stepName || eventType || "Observation");
      const message = String(eventData?.message || eventData?.detail || eventData?.note || "").trim();
      if (!message && !eventData?.screenshotUrl) return;

      const status = eventType.includes("failed")
        ? "failed"
        : eventType.includes("complete") || eventType.includes("analyzed")
          ? "completed"
          : "running";

      const observation = {
        id: `${String(eventData?.actionId || actionName)}-${String(event?.timestamp || Date.now())}`,
        name: actionName,
        status,
        observed: message || "Observation updated",
        timestamp: String(event?.timestamp || new Date().toISOString()),
        screenshotUrl: String(eventData?.screenshotUrl || ""),
      };

      setLiveObservationsByResult((prev) => {
        const current = Array.isArray(prev[targetResultId]) ? prev[targetResultId] : [];
        if (current.some((item) => item.id === observation.id)) {
          return prev;
        }
        const next = [...current, observation].slice(-120);
        return { ...prev, [targetResultId]: next };
      });
    },
  });

  useEffect(() => {
    if (!open || !selectedResult?.id || !orgSlug || !runId) return;
    const resultId = String(selectedResult.id);

    if (!logsByResult[resultId]) {
      getRunResultLogs(orgSlug, runId, resultId)
        .then((data) => {
          const payload = data?.logs ?? data ?? null;
          setResultPayloadById((prev) => ({ ...prev, [resultId]: payload }));
          setLogsByResult((prev) => ({ ...prev, [resultId]: normalizeLogLines(payload) }));
        })
        .catch(() => {
          setLogsByResult((prev) => ({ ...prev, [resultId]: [] }));
        });
    }

    if (!artifactsByResult[resultId]) {
      getResultArtifacts(resultId)
        .then((data) => {
          setArtifactsByResult((prev) => ({ ...prev, [resultId]: data?.artifacts || null }));
        })
        .catch(() => {
          setArtifactsByResult((prev) => ({ ...prev, [resultId]: null }));
        });
    }
  }, [open, selectedResult?.id, orgSlug, runId]);

  useEffect(() => {
    if (!open || !selectedResult?.id || !orgSlug || !runId) return;
    const isActiveRun = ["Pending", "Queued", "Running"].includes(String(run?.status || ""));
    if (!isActiveRun) return;

    const resultId = String(selectedResult.id);
    const timer = window.setInterval(() => {
      getRunResultLogs(orgSlug, runId, resultId)
        .then((data) => {
          const payload = data?.logs ?? data ?? null;
          setResultPayloadById((prev) => ({ ...prev, [resultId]: payload }));
          setLogsByResult((prev) => ({ ...prev, [resultId]: normalizeLogLines(payload) }));
        })
        .catch(() => undefined);

      getResultArtifacts(resultId)
        .then((data) => {
          setArtifactsByResult((prev) => ({ ...prev, [resultId]: data?.artifacts || null }));
        })
        .catch(() => undefined);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [open, selectedResult?.id, orgSlug, runId, run?.status]);

  useEffect(() => {
    if (!open || activeTab !== "network" || !selectedResult?.id) return;
    const resultId = String(selectedResult.id);
    const url = artifactsByResult[resultId]?.networkLogsUrl || toArtifactUrl(selectedResult?.networkLogsPath);
    if (!url) {
      return;
    }
    fetch(url, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.logs) ? payload.logs : [];
        setNetworkByResult((prev) => ({ ...prev, [resultId]: rows }));
      })
      .catch(() => {
        setNetworkByResult((prev) => ({ ...prev, [resultId]: [] }));
      });
  }, [open, activeTab, selectedResult?.id, artifactsByResult]);

  useEffect(() => {
    if (!open || activeTab !== "console" || !selectedResult?.id) return;
    const resultId = String(selectedResult.id);
    const existing = logsByResult[resultId] || [];
    if (existing.length > 0) return;

    const logsUrl = artifactsByResult[resultId]?.consoleLogsUrl || toArtifactUrl(selectedResult?.consoleLogsPath);
    if (!logsUrl) return;

    fetch(logsUrl, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.logs) ? payload.logs : [];
        setLogsByResult((prev) => ({ ...prev, [resultId]: normalizeLogLines(rows) }));
      })
      .catch(() => undefined);
  }, [open, activeTab, selectedResult?.id, artifactsByResult, logsByResult]);

  if (!open) return null;

  const selectedResultId = String(selectedResult?.id || "");
  const selectedArtifacts = selectedResultId ? artifactsByResult[selectedResultId] : null;
  const selectedLogs = selectedResultId ? logsByResult[selectedResultId] || [] : [];
  const selectedNetworkLogs = selectedResultId ? networkByResult[selectedResultId] || [] : [];
  const selectedVideoUrl = selectedArtifacts?.videoUrl || toArtifactUrl(selectedResult?.videoPath);
  const structuredOutput = selectedResult?.structuredOutput || {};
  const runtimePayload = selectedResultId ? resultPayloadById[selectedResultId] : null;
  const screenshotRawValues = [
    ...(Array.isArray(selectedArtifacts?.screenshotsUrls) ? selectedArtifacts.screenshotsUrls : []),
    ...(Array.isArray(runtimePayload?.artifacts?.screenshotsPath) ? runtimePayload.artifacts.screenshotsPath : []),
    ...(Array.isArray(structuredOutput?.artifacts?.screenshotsPath) ? structuredOutput.artifacts.screenshotsPath : []),
    ...(Array.isArray(structuredOutput?.screenshots) ? structuredOutput.screenshots : []),
    ...(Array.isArray(selectedResult?.screenshotsPath) ? selectedResult.screenshotsPath : []),
    ...(Array.isArray(structuredOutput?.browserActions)
      ? structuredOutput.browserActions.map((action) => action?.screenshotUrl || action?.screenshotPath || action?.screenshot || "")
      : []),
    ...(Array.isArray(runtimePayload?.browserActions)
      ? runtimePayload.browserActions.map((action) => action?.screenshotUrl || action?.screenshotPath || action?.screenshot || "")
      : []),
  ];

  const screenshotItems = screenshotRawValues.map((item, index) => ({
    key: `${String(item || "")}-${index}`,
    candidates: buildArtifactUrlCandidates(item),
  })).filter((item) => item.candidates.length > 0);

  const runLevelScreenshotCandidates = Array.from(
    new Set(
      screenshotItems.flatMap((item) => (Array.isArray(item?.candidates) ? item.candidates : [])).filter(Boolean),
    ),
  );

  const structuredSteps = Array.isArray(structuredOutput?.steps)
    ? structuredOutput.steps
    : Array.isArray(structuredOutput?.rawOutput?.results?.steps)
      ? structuredOutput.rawOutput.results.steps
      : Array.isArray(runtimePayload?.steps)
        ? runtimePayload.steps
        : Array.isArray(runtimePayload?.results?.steps)
          ? runtimePayload.results.steps
          : Array.isArray(runtimePayload?.rawOutput?.results?.steps)
            ? runtimePayload.rawOutput.results.steps
            : [];

  const structuredBrowserActions = Array.isArray(structuredOutput?.browserActions)
    ? structuredOutput.browserActions
    : Array.isArray(structuredOutput?.rawOutput?.results?.browserActions)
      ? structuredOutput.rawOutput.results.browserActions
      : Array.isArray(runtimePayload?.browserActions)
        ? runtimePayload.browserActions
        : Array.isArray(runtimePayload?.results?.browserActions)
          ? runtimePayload.results.browserActions
          : Array.isArray(runtimePayload?.rawOutput?.results?.browserActions)
            ? runtimePayload.rawOutput.results.browserActions
            : [];

  const actionScreenshotByName = new Map();
  structuredBrowserActions.forEach((action) => {
    const actionNameKey = normalizeStepKey(action?.step || action?.action || "");
    const screenshotValue = action?.screenshotUrl || action?.screenshotPath || action?.screenshot || "";
    if (!actionNameKey || !screenshotValue || actionScreenshotByName.has(actionNameKey)) return;
    actionScreenshotByName.set(actionNameKey, screenshotValue);
  });

  const normalizedRuntimeSteps = structuredSteps.map((step, index) => {
    const stepName = step?.name || step?.action || `Step ${index + 1}`;
    const byNameScreenshot = actionScreenshotByName.get(normalizeStepKey(stepName)) || "";
    const fallbackScreenshot = byNameScreenshot || "";

    return {
      ...step,
      name: stepName,
      observed: step?.observed || step?.message || step?.expectedResult || "",
      status: step?.status || "pending",
      error: step?.error || null,
      screenshotUrl: step?.screenshotUrl || step?.screenshotPath || step?.screenshot || fallbackScreenshot,
    };
  });

  const normalizedActionObservations = structuredBrowserActions.map((action, index) => {
    const inlineScreenshot = action?.screenshotUrl || action?.screenshotPath || action?.screenshot || "";
    const inlineCandidates = buildArtifactUrlCandidates(inlineScreenshot);
    const fallbackByIndex = screenshotItems[index] || null;
    const screenshotCandidates = inlineCandidates.length ? inlineCandidates : (fallbackByIndex?.candidates || []);

    return {
      name: action?.step || action?.action || `Action ${index + 1}`,
      observed: action?.message || action?.observed || action?.targetElement || "",
      status:
        action?.status === "completed"
          ? "completed"
          : action?.status === "failed"
            ? "failed"
            : "running",
      error: action?.error || null,
      screenshotKey: fallbackByIndex?.key || `${String(action?.step || action?.action || "action")}-${index}`,
      screenshotCandidates,
    };
  });

  const resultStatusText = String(selectedResult?.status || "").toLowerCase();
  const finishedResultStatus = resultStatusText === "passed" || resultStatusText === "completed"
    ? "passed"
    : resultStatusText === "failed" || resultStatusText === "error" || resultStatusText === "cancelled"
      ? "failed"
      : "pending";

  const fallbackSteps = Array.isArray(selectedResult?.testCase?.steps)
    ? [...selectedResult.testCase.steps].sort((a, b) => Number(a?.stepOrder || 0) - Number(b?.stepOrder || 0)).map((step) => ({
        name: step?.action || "Step",
        observed: step?.expectedResult || "",
        status: finishedResultStatus,
      }))
    : [];

  const hasDetailedRuntimeObservations = normalizedRuntimeSteps.some((step) => {
    const status = String(step?.status || "").toLowerCase();
    const observation = String(step?.observed || "").trim();
    return status !== "pending" || observation.length > 0;
  });

  const baseSteps = hasDetailedRuntimeObservations
    ? normalizedRuntimeSteps
    : normalizedActionObservations.length
      ? normalizedActionObservations
      : fallbackSteps;

  const steps = (() => {
    const cloned = Array.isArray(baseSteps) ? baseSteps.map((item) => ({ ...item })) : [];
    const resultIsFailed = finishedResultStatus === "failed";
    const hasFailedStep = cloned.some((step) => {
      const status = String(step?.status || "").toLowerCase();
      return status === "failed" || status === "error" || status === "aborted" || status === "cancelled";
    });

    if (resultIsFailed && cloned.length > 0 && !hasFailedStep) {
      const lastIndex = cloned.length - 1;
      const fallbackError = String(selectedResult?.errorMessage || "Final verification failed.").trim();
      cloned[lastIndex] = {
        ...cloned[lastIndex],
        status: "failed",
        error: cloned[lastIndex]?.error || fallbackError,
        observed: String(cloned[lastIndex]?.observed || "").trim() || fallbackError,
      };
    }

    return cloned;
  })();

  const stepScreenshotItems = (() => {
    const usedActionIndices = new Set();
    let nextActionCursor = 0;
    const actionCandidates = normalizedActionObservations
      .map((actionStep, actionIndex) => ({
        actionIndex,
        normalizedName: normalizeStepKey(actionStep?.name || ""),
        searchText: [
          actionStep?.name,
          actionStep?.observed,
          actionStep?.error,
          structuredBrowserActions[actionIndex]?.message,
          structuredBrowserActions[actionIndex]?.targetElement,
          structuredBrowserActions[actionIndex]?.step,
          structuredBrowserActions[actionIndex]?.action,
        ].filter(Boolean).join(" "),
        key: actionStep?.screenshotKey || `action-${actionIndex}`,
        candidates: Array.isArray(actionStep?.screenshotCandidates) ? actionStep.screenshotCandidates : [],
      }))
      .filter((item) => item.candidates.length > 0);

    return (Array.isArray(steps) ? steps : []).map((step, index) => {
      const inlineStepScreenshot = step?.screenshotUrl || step?.screenshotPath || step?.screenshot || "";
      const inlineCandidates = buildArtifactUrlCandidates(inlineStepScreenshot);
      if (inlineCandidates.length > 0) {
        return {
          key: `step-inline-${index}`,
          candidates: inlineCandidates,
        };
      }

      const normalizedName = normalizeStepKey(step?.name || `Step ${index + 1}`);
      const stepTokens = tokenizeMatchText(`${step?.name || ""} ${step?.observed || ""} ${step?.message || ""}`);

      const forwardCandidates = actionCandidates.filter((item) =>
        !usedActionIndices.has(item.actionIndex) && item.actionIndex >= nextActionCursor,
      );

      const candidatePool = forwardCandidates.length
        ? forwardCandidates
        : actionCandidates.filter((item) => !usedActionIndices.has(item.actionIndex));

      const scoredCandidates = candidatePool
        .map((item) => {
          const candidateTokens = tokenizeMatchText(item.searchText);
          const overlapCount = stepTokens.reduce((count, token) => (candidateTokens.includes(token) ? count + 1 : count), 0);
          const expectedIndex = actionCandidates.length > 0 && steps.length > 0
            ? Math.min(
                actionCandidates.length - 1,
                Math.max(0, Math.round(((index + 1) * actionCandidates.length) / steps.length) - 1),
              )
            : index;
          const distancePenalty = Math.abs(item.actionIndex - expectedIndex);
          const exactNameBonus = item.normalizedName && item.normalizedName === normalizedName ? 12 : 0;
          const score = (overlapCount * 5) + exactNameBonus - distancePenalty;
          return { ...item, score };
        })
        .sort((a, b) => b.score - a.score || a.actionIndex - b.actionIndex);

      const bestCandidate = scoredCandidates[0] || null;

      if (bestCandidate && bestCandidate.score >= 3) {
        usedActionIndices.add(bestCandidate.actionIndex);
        nextActionCursor = bestCandidate.actionIndex + 1;
        return {
          key: bestCandidate.key,
          candidates: bestCandidate.candidates,
        };
      }

      const nearestMatch = candidatePool.find((item) => {
        if (usedActionIndices.has(item.actionIndex)) return false;
        return item.actionIndex >= nextActionCursor;
      }) || candidatePool[0] || null;

      if (nearestMatch) {
        usedActionIndices.add(nearestMatch.actionIndex);
        nextActionCursor = nearestMatch.actionIndex + 1;
        return {
          key: nearestMatch.key,
          candidates: nearestMatch.candidates,
        };
      }

      const indexedScreenshotItem = screenshotItems[index] || null;
      if (indexedScreenshotItem?.candidates?.length) {
        return indexedScreenshotItem;
      }

      if (runLevelScreenshotCandidates.length > 0) {
        const offset = index % runLevelScreenshotCandidates.length;
        return {
          key: `run-fallback-${index}`,
          candidates: [
            ...runLevelScreenshotCandidates.slice(offset),
            ...runLevelScreenshotCandidates.slice(0, offset),
          ],
        };
      }

      return null;
    });
  })();

  const runRerun = async () => {
    if (!orgSlug || !runId) return;
    if (rerunMode === "single" && !selectedResultId) return;
    setRerunning(true);
    try {
      if (rerunMode === "single") {
        await rerunRunResult(orgSlug, runId, selectedResultId);
      } else {
        await rerunRun(orgSlug, runId, { parallelSessions });
      }
      const refreshed = await getRun(orgSlug, runId);
      setRun(refreshed || null);
      setRerunModalOpen(false);
    } catch (err) {
      setError(err?.message || "Failed to rerun");
    } finally {
      setRerunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[1400px] h-[95vh] sm:h-[92vh] rounded-2xl border border-black/8 dark:border-white/10 bg-card shadow-2xl overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        {/* ── Header ── */}
        <div className="h-16 px-5 sm:px-6 border-b border-black/8 dark:border-white/8 flex items-center justify-between gap-4 shrink-0 bg-gradient-to-r from-card to-card/80">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-[#232323] dark:text-white truncate tracking-tight">{run?.testPlan?.name || "Run details"}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              {statusBadge(run?.status)}
              <span className="text-xs text-[#232323]/55 dark:text-white/55 font-medium tabular-nums">
                <span className="text-green-600 dark:text-green-400 font-semibold">{run?.passedTests || 0}</span>
                <span className="mx-0.5">/</span>
                <span>{run?.totalTests || 0}</span>
                <span className="ml-1">passed</span>
              </span>
              {run?.failedTests ? (
                <span className="text-xs font-medium">
                  <span className="text-red-500 dark:text-red-400 font-semibold">{run.failedTests}</span>
                  <span className="text-[#232323]/45 dark:text-white/45 ml-1">failed</span>
                </span>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-xl border border-black/8 dark:border-white/12 inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/8 transition-colors">
            <X className="h-4 w-4 text-[#232323]/70 dark:text-white/70" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#232323]/60 dark:text-white/60">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#FFAA00]" />
            Loading run details...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-xl border border-red-400/30 bg-red-500/8 px-4 py-3 text-sm text-red-600 dark:text-red-300 inline-flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
            {/* ── Left sidebar: test case list ── */}
            <div className="w-full sm:w-80 lg:w-96 sm:border-r border-b sm:border-b-0 border-black/8 dark:border-white/8 min-h-0 flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-black/6 dark:border-white/6 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">Test case results ({results.length})</span>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-2 space-y-1.5">
                {results.map((result) => {
                  const selected = String(result?.id) === selectedResultId;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => setActiveResultId(String(result.id))}
                      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-all duration-150 ${selected ? "border-[#FFAA00]/50 bg-[#FFAA00]/8 shadow-sm shadow-[#FFAA00]/10" : "border-black/6 dark:border-white/8 hover:border-black/15 dark:hover:border-white/15 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#232323] dark:text-white truncate leading-snug">{result?.testCase?.title || "Test case"}</p>
                          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[#232323]/50 dark:text-white/50">
                            <Folder className="h-3 w-3 shrink-0" />
                            <span className="truncate">{result?.testCase?.folder?.path || "No folder"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/6 dark:border-white/10 text-[#232323]/65 dark:text-white/65 font-medium shrink-0">{result?.browser || "desktop-chrome"}</span>
                      </div>
                      <div className="mt-2">{statusBadge(result?.status)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Right panel: detail view ── */}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
              {!selectedResult ? (
                <div className="flex-1 flex items-center justify-center text-sm text-[#232323]/50 dark:text-white/50">
                  {isActiveRunStatus(run?.status) ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#FFAA00]" />
                      Results are being generated...
                    </div>
                  ) : "Select a test result to view details."}
                </div>
              ) : (
                <>
                  {/* ── Detail header ── */}
                  <div className="px-5 sm:px-6 py-4 border-b border-black/6 dark:border-white/6 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-[#232323] dark:text-white truncate tracking-tight">{selectedResult?.testCase?.title || "Test case"}</h3>
                        <p className="text-xs text-[#232323]/45 dark:text-white/45 mt-1 font-medium">
                          Duration: <span className="text-[#232323]/65 dark:text-white/65">{formatDuration(selectedResult?.duration)}</span>
                          <span className="mx-2 text-[#232323]/20 dark:text-white/20">|</span>
                          Browser: <span className="text-[#232323]/65 dark:text-white/65">{selectedResult?.browser || "desktop-chrome"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(selectedResult?.status)}
                        <button
                          type="button"
                          onClick={() => {
                            setRerunMode("single");
                            setParallelSessions(1);
                            setRerunModalOpen(true);
                          }}
                          className="h-8 px-3.5 rounded-lg border border-black/8 dark:border-white/12 text-xs font-semibold text-[#232323]/80 dark:text-white/80 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                        >
                          Re-run This
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRerunMode("all");
                            setRerunModalOpen(true);
                          }}
                          className="h-8 px-3.5 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-xs font-semibold transition-colors"
                        >
                          Re-run All
                        </button>
                      </div>
                    </div>
                    {selectedResult?.errorMessage ? (
                      <div className="mt-3 rounded-lg border border-red-300/30 bg-red-500/6 px-3 py-2.5 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{selectedResult.errorMessage}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* ── Tabs ── */}
                  <div className="px-5 sm:px-6 py-2.5 border-b border-black/6 dark:border-white/6 flex items-center gap-1.5 shrink-0 overflow-x-auto">
                    {[
                      { key: "steps", label: "Steps", icon: FileText },
                      { key: "video", label: "Video", icon: Video },
                      { key: "console", label: "Console", icon: TerminalSquare },
                      { key: "network", label: "Network", icon: Globe2 },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`h-8 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                          activeTab === key
                            ? "bg-[#FFAA00] text-[#232323] shadow-sm shadow-[#FFAA00]/20"
                            : "border border-black/8 dark:border-white/10 text-[#232323]/65 dark:text-white/65 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}

                    <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[#232323]/40 dark:text-white/40 font-medium shrink-0">
                      <span className="relative flex h-2 w-2">
                        {isActiveRunStatus(run?.status) ? <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /> : null}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isActiveRunStatus(run?.status) ? "bg-green-500" : "bg-[#232323]/20 dark:bg-white/20"}`} />
                      </span>
                      Realtime
                    </div>
                  </div>

                  {/* ── Tab content ── */}
                  <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-5">
                    {activeTab === "steps" ? (
                      <div className="space-y-3">
                        {steps.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-[#232323]/40 dark:text-white/40">
                            <FileText className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No steps available yet.</p>
                          </div>
                        ) : (
                          steps.map((step, index) => (
                            <div key={`${index}-${step?.name || "step"}`} className="rounded-xl border border-black/6 dark:border-white/8 bg-white/50 dark:bg-white/[0.03] overflow-hidden">
                              {(() => {
                                const stepStatus = String(step?.status || "pending").toLowerCase();
                                const isPassed = stepStatus === "passed" || stepStatus === "completed";
                                const isFailed = stepStatus === "failed" || stepStatus === "error";
                                const resolvedScreenshotItem = stepScreenshotItems[index] || null;
                                const screenshotCandidates = resolvedScreenshotItem?.candidates || [];

                                const noteText = String(
                                  step?.observed ||
                                  step?.message ||
                                  step?.error ||
                                  (isFailed
                                    ? "AI noted a failure on this step."
                                    : isPassed
                                      ? "AI noted this step passed successfully."
                                      : "AI is analyzing this step."),
                                );

                                const statusClasses = isPassed
                                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
                                  : isFailed
                                    ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                                    : "border-black/10 dark:border-white/12 bg-black/[0.03] dark:bg-white/[0.05] text-[#232323]/60 dark:text-white/60";

                                const cardAccent = isPassed
                                  ? "border-l-green-500"
                                  : isFailed
                                    ? "border-l-red-500"
                                    : "border-l-[#FFAA00]/60";

                                return (
                              <div className={`flex flex-col sm:flex-row items-start gap-4 p-4 border-l-[3px] ${cardAccent}`}>
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[11px] font-bold text-[#232323]/30 dark:text-white/25 tabular-nums shrink-0">{String(index + 1).padStart(2, '0')}</span>
                                      <p className="text-[13px] font-semibold text-[#232323] dark:text-white truncate">{step?.name || `Step ${index + 1}`}</p>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border ${statusClasses}`}>
                                      {isPassed ? <CheckCircle2 className="h-3 w-3" /> : null}
                                      {isFailed ? <XCircle className="h-3 w-3" /> : null}
                                      {String(step?.status || "pending")}
                                    </span>
                                  </div>

                                  <div className="mt-3 rounded-lg border border-black/6 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.02] px-3.5 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#232323]/40 dark:text-white/35 mb-1">AI Note</p>
                                    <p className="text-xs text-[#232323]/70 dark:text-white/65 leading-relaxed break-words">{noteText}</p>
                                  </div>

                                  {step?.error ? (
                                    <div className="mt-2 rounded-lg border border-red-300/25 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-300 break-words flex items-start gap-1.5">
                                      <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                      {step.error}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="w-full sm:w-48 lg:w-56 shrink-0">
                                  {screenshotCandidates.length ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const key = resolvedScreenshotItem?.key;
                                        const target = key
                                          ? (resolvedScreenshotUrlByKey[key] || screenshotCandidates[0])
                                          : screenshotCandidates[0];
                                        window.open(target, "_blank", "noopener,noreferrer");
                                      }}
                                      className="w-full rounded-xl border border-black/8 dark:border-white/10 overflow-hidden bg-card hover:border-black/15 dark:hover:border-white/20 transition-colors group"
                                    >
                                      <ArtifactImage
                                        candidates={screenshotCandidates}
                                        alt={`Step ${index + 1} screenshot`}
                                        className="w-full h-32 object-cover bg-muted"
                                        onResolved={(url) => {
                                          if (!resolvedScreenshotItem?.key) return;
                                          setResolvedScreenshotUrlByKey((prev) =>
                                            prev[resolvedScreenshotItem.key] === url ? prev : { ...prev, [resolvedScreenshotItem.key]: url },
                                          );
                                        }}
                                      />
                                      <div className="px-2.5 py-2 text-[10px] text-[#232323]/50 dark:text-white/50 inline-flex items-center gap-1.5 group-hover:text-[#FFAA00] transition-colors">
                                        <ExternalLink className="h-3 w-3" />
                                        Screenshot
                                      </div>
                                    </button>
                                  ) : (
                                    <div className="h-32 rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02] text-[11px] text-[#232323]/35 dark:text-white/30 flex items-center justify-center px-3 text-center">
                                      Screenshot not available yet
                                    </div>
                                  )}
                                </div>
                              </div>
                                );
                              })()}
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}

                    {activeTab === "video" ? (
                      selectedVideoUrl ? (
                        <div className="rounded-xl border border-black/8 dark:border-white/10 overflow-hidden bg-[#0d0b1f] dark:bg-[#1a1a2e]">
                          <video controls src={selectedVideoUrl} className="w-full max-h-[60vh]" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#232323]/40 dark:text-white/40">
                          <Video className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">Video not available yet.</p>
                        </div>
                      )
                    ) : null}

                    {activeTab === "console" ? (
                      selectedLogs.length ? (
                        <div className="rounded-xl border border-black/8 dark:border-white/10 bg-[#0d0b1f] dark:bg-[#1a1a2e] text-white p-4 font-mono text-xs space-y-1 max-h-[60vh] overflow-auto">
                          {selectedLogs.map((entry, index) => (
                            <div key={`${index}-${entry.timestamp || ""}`} className="py-0.5 border-b border-white/[0.04] last:border-b-0">
                              <span className="text-[#FFAA00] font-semibold">[{entry.type}]</span>
                              {entry.timestamp ? <span className="text-white/35 ml-1.5">{entry.timestamp}</span> : null}
                              <span className="text-white/85 ml-1.5">{entry.message}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#232323]/40 dark:text-white/40">
                          <TerminalSquare className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">Console logs not available yet.</p>
                        </div>
                      )
                    ) : null}

                    {activeTab === "network" ? (
                      selectedNetworkLogs.length ? (
                        <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] divide-y divide-black/6 dark:divide-white/6 overflow-hidden">
                          <div className="grid grid-cols-12 px-4 py-2 bg-black/[0.03] dark:bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-[#232323]/40 dark:text-white/35">
                            <span className="col-span-1">Method</span>
                            <span className="col-span-1">Status</span>
                            <span className="col-span-10">URL</span>
                          </div>
                          {selectedNetworkLogs.map((entry, index) => (
                            <div key={`${index}-${entry?.url || ""}`} className="grid grid-cols-12 px-4 py-2.5 text-xs items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                              <span className="col-span-1 font-bold text-[#232323]/80 dark:text-white/80">{entry?.method || "GET"}</span>
                              <span className={`col-span-1 font-semibold tabular-nums ${
                                String(entry?.status || "").startsWith("2") ? "text-green-600 dark:text-green-400" :
                                String(entry?.status || "").startsWith("4") || String(entry?.status || "").startsWith("5") ? "text-red-500 dark:text-red-400" :
                                "text-[#232323]/60 dark:text-white/60"
                              }`}>{entry?.status || "-"}</span>
                              <p className="col-span-10 text-[#232323]/55 dark:text-white/55 break-all font-mono text-[11px]">{entry?.url || "-"}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#232323]/40 dark:text-white/40">
                          <Globe2 className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">Network logs not available yet.</p>
                        </div>
                      )
                    ) : null}
                  </div>

                  {/* ── Footer navigation ── */}
                  <div className="h-14 px-5 sm:px-6 border-t border-black/6 dark:border-white/6 flex items-center justify-between shrink-0 bg-black/[0.01] dark:bg-white/[0.01]">
                    <p className="text-xs text-[#232323]/45 dark:text-white/45 font-medium tabular-nums">
                      Result <span className="text-[#232323]/70 dark:text-white/70 font-semibold">{Math.max(1, results.findIndex((result) => String(result.id) === selectedResultId) + 1)}</span> of <span className="text-[#232323]/70 dark:text-white/70 font-semibold">{Math.max(1, results.length)}</span>
                    </p>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const index = results.findIndex((result) => String(result.id) === selectedResultId);
                          if (index > 0) setActiveResultId(String(results[index - 1].id));
                        }}
                        disabled={results.findIndex((result) => String(result.id) === selectedResultId) <= 0}
                        className="h-8 px-3.5 rounded-lg border border-black/8 dark:border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 text-[#232323]/70 dark:text-white/70 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const index = results.findIndex((result) => String(result.id) === selectedResultId);
                          if (index < results.length - 1) setActiveResultId(String(results[index + 1].id));
                        }}
                        disabled={results.findIndex((result) => String(result.id) === selectedResultId) >= results.length - 1}
                        className="h-8 px-3.5 rounded-lg border border-black/8 dark:border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 text-[#232323]/70 dark:text-white/70 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {rerunModalOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/55 flex items-center justify-center p-4" onClick={() => !rerunning && setRerunModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-lg font-semibold text-[#232323] dark:text-white">{rerunMode === "single" ? "Re-run this test" : "Re-run all tests"}</p>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">{rerunMode === "single" ? "This will queue the selected test case again." : "This will queue all test cases in this run."}</p>

            {rerunMode === "all" ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[#232323]/65 dark:text-white/65 mb-2">
                  <span>Parallel sessions</span>
                  <span className="font-semibold">{parallelSessions}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={parallelSessions}
                  onChange={(event) => setParallelSessions(Number(event.target.value))}
                  className="w-full accent-[#FFAA00]"
                />
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRerunModalOpen(false)}
                disabled={rerunning}
                className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runRerun}
                disabled={rerunning}
                className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                {rerunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Run
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ExecutionRuns() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [runs, setRuns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState("");

  const refreshRuns = async () => {
    if (!orgSlug) return;
    const rows = await listRuns(orgSlug, {
      projectId: projectId || undefined,
      status: status || undefined,
    });
    setRuns(rows);
  };

  const loadData = async (initial = false) => {
    if (!orgSlug) return;
    if (initial) setLoading(true);
    setError("");
    try {
      const projectRows = await fetchTestProjects(orgSlug);
      setProjects(projectRows);
      const savedProjectId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`selectedProject_${orgSlug}`) || ""
          : "";
      const effectiveProjectId = projectId || projectRows[0]?.id || "";
      const syncedProjectId =
        savedProjectId && projectRows.some((project) => project.id === savedProjectId)
          ? savedProjectId
          : effectiveProjectId;
      if (!projectId && syncedProjectId) {
        setProjectId(syncedProjectId);
      }
      const rows = await listRuns(orgSlug, {
        projectId: syncedProjectId || undefined,
        status: status || undefined,
      });
      setRuns(rows);
    } catch (err) {
      setError(err?.message || "Failed to load test runs");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug) return;
    if (projectId && typeof window !== "undefined") {
      window.localStorage.setItem(`selectedProject_${orgSlug}`, projectId);
    }
    refreshRuns()
      .catch((err) => setError(err?.message || "Failed to load test runs"));
  }, [orgSlug, projectId, status]);

  useEffect(() => {
    if (!orgSlug) return;

    const hasActiveRun = runs.some((run) => isActiveRunStatus(run?.status));
    const intervalMs = hasActiveRun ? 2500 : 15000;
    const timer = window.setInterval(() => {
      refreshRuns().catch(() => undefined);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [orgSlug, projectId, status, runs]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshRuns().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [orgSlug, projectId, status]);

  useTestRunGlobalUpdates((event) => {
    // Immediately merge counter updates from socket before the full refresh
    if (event?.testRunId && (event.passedTests != null || event.failedTests != null)) {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === event.testRunId
            ? {
                ...r,
                ...(event.status ? { status: event.status } : {}),
                ...(event.passedTests != null ? { passedTests: event.passedTests } : {}),
                ...(event.failedTests != null ? { failedTests: event.failedTests } : {}),
                ...(event.skippedTests != null ? { skippedTests: event.skippedTests } : {}),
                ...(event.totalTests != null ? { totalTests: event.totalTests } : {}),
              }
            : r
        )
      );
    }
    refreshRuns().catch(() => undefined);
  });

  // Real-time org slot counter
  const orgSlotsData = useOrgSlots(orgSlug);

  useEffect(() => {
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

  const filteredRuns = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return runs;
    return runs.filter((run) => {
      const planName = String(run?.testPlan?.name || "").toLowerCase();
      const environment = String(run?.environment || "").toLowerCase();
      const runStatus = String(run?.status || "").toLowerCase();
      return planName.includes(term) || environment.includes(term) || runStatus.includes(term);
    });
  }, [runs, search]);

  const runCounters = useMemo(() => {
    return runs.reduce(
      (acc, run) => {
        const normalized = String(run?.status || "").toLowerCase();
        if (isActiveRunStatus(normalized)) acc.running += 1;
        else if (normalized === "completed" || normalized === "passed") acc.passed += 1;
        else if (normalized === "failed" || normalized === "error") acc.failed += 1;
        else if (isStoppedRunStatus(normalized)) acc.stopped += 1;
        return acc;
      },
      { running: 0, stopped: 0, passed: 0, failed: 0 },
    );
  }, [runs]);

  const handleCancelRun = async (runId) => {
    setSaving(true);
    setError("");
    try {
      await cancelRun(orgSlug, runId);
      setRuns(await listRuns(orgSlug, { projectId: projectId || undefined, status: status || undefined }));
    } catch (err) {
      setError(err?.message || "Failed to cancel run");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRun = async (runId) => {
    setSaving(true);
    setError("");
    try {
      await deleteRun(orgSlug, runId);
      setRuns(await listRuns(orgSlug, { projectId: projectId || undefined, status: status || undefined }));
    } catch (err) {
      setError(err?.message || "Failed to delete run");
    } finally {
      setSaving(false);
    }
  };

  const openRunDetail = (runId) => {
    if (!orgSlug || !runId) return;
    setSelectedRunId(runId);
    setDetailsModalOpen(true);
  };

  const openRunPage = (runId) => {
    if (!orgSlug || !runId) return;
    navigate(`/dashboard/${orgSlug}/execution/runs/${runId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-0 bg-transparent overflow-hidden">
        <div className="border-b border-black/10 dark:border-white/10 bg-card/95 px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#232323] dark:text-white">Test Runs</h2>
              <span className="text-sm text-[#232323]/50 dark:text-white/50">({runs.length})</span>
            </div>
            <p className="text-sm text-[#232323]/60 dark:text-white/60">View and manage test execution history</p>
          </div>

          <div className="flex items-center gap-3">
            {/*{orgSlotsData && (
              <div className="flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-background/70 px-3 py-1.5">
                <div className={`h-2 w-2 rounded-full ${orgSlotsData.available > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-medium text-[#232323]/70 dark:text-white/70">
                  Slots: <span className={`font-semibold ${orgSlotsData.available > 0 ? 'text-green-600' : 'text-red-500'}`}>{orgSlotsData.available}</span>
                  <span className="text-[#232323]/40 dark:text-white/40">/{orgSlotsData.limit}</span>
                </span>
              </div>
            )} */}
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${orgSlug}/execution/plans`)}
              className="h-8 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Run a Plan
            </button>
          </div>
        </div>

        <div className="border-b border-black/10 dark:border-white/10 bg-card/90 px-6 py-3 flex items-center gap-3">
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm min-w-[160px]"
          >
            {!projects.length ? <option value="">No projects</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#232323]/40 dark:text-white/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search runs..."
              className="w-full h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="relative">
            <button type="button" onClick={() => setStatusDropdownOpen((v) => !v)} className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/70 text-xs font-semibold inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              {status || "Status"}
            </button>
            {statusDropdownOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-black/10 dark:border-white/10 bg-card shadow-lg p-1">
                  {[
                    { value: "", label: "All statuses" },
                    { value: "Pending", label: "Pending" },
                    { value: "Queued", label: "Queued" },
                    { value: "Running", label: "Running" },
                    { value: "Completed", label: "Completed" },
                    { value: "Failed", label: "Failed" },
                    { value: "Aborted", label: "Aborted" },
                    { value: "Error", label: "Error" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setStatus(opt.value); setStatusDropdownOpen(false); }}
                      className={`w-full h-8 px-2.5 rounded-md text-left text-xs font-medium ${
                        status === opt.value
                          ? "bg-[#FFAA00]/15 text-[#FFAA00] dark:text-[#FFAA00]"
                          : "text-[#232323] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-3 border-b border-black/10 dark:border-white/10 bg-card/85 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-blue-200/70 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold">
            <Loader2 className="h-3.5 w-3.5" />
            Running: {runCounters.running}
          </span>
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-amber-200/70 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold">
            <Square className="h-3.5 w-3.5" />
            Stopped: {runCounters.stopped}
          </span>
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-green-200/70 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Passed: {runCounters.passed}
          </span>
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-red-200/70 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold">
            <XCircle className="h-3.5 w-3.5" />
            Failed: {runCounters.failed}
          </span>
        </div>

        {error ? <div className="mx-6 mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300 inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div> : null}

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card p-6 text-center text-sm text-[#232323]/60 dark:text-white/60">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FFAA00]" />
              Loading runs...
            </div>
          ) : !filteredRuns.length ? (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card p-8 text-center">
              <p className="text-sm text-[#232323]/60 dark:text-white/60">No runs found.</p>
            </div>
          ) : (
            filteredRuns.map((run) => {
              const runId = resolveRunId(run);
              const canCancel = ["Pending", "Queued", "Running"].includes(String(run.status || ""));
              return (
                <div
                  key={runId || `${run.testPlan?.name || "run"}-${run.createdAt || "now"}`}
                  className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 shadow-sm hover:shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all p-4 cursor-pointer"
                  onClick={() => openRunDetail(runId)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-[#232323] dark:text-white truncate">{run.testPlan?.name || "Plan"}</p>
                        {statusBadge(run.status)}
                      </div>
                      <p className="text-xs text-[#232323]/50 dark:text-white/50 mt-1">{formatRelativeTime(run.createdAt)}</p>
                    </div>

                    <div className="relative inline-flex items-center gap-2">
                      {canCancel ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCancelRun(runId);
                          }}
                          disabled={saving || !runId}
                          className="h-8 px-3 rounded-lg border border-red-300/70 text-red-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <Square className="h-3.5 w-3.5" />
                          Stop
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((prev) => (prev === runId ? "" : runId));
                        }}
                        className="h-8 w-8 rounded-lg border border-black/10 dark:border-white/15 bg-background/70 inline-flex items-center justify-center"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === runId ? (
                        <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-black/10 dark:border-white/10 bg-card shadow-lg p-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId("");
                              openRunDetail(runId);
                            }}
                            disabled={!runId}
                            className="w-full h-8 px-2 rounded-md text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Popup
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId("");
                              openRunPage(runId);
                            }}
                            disabled={!runId}
                            className="w-full h-8 px-2 rounded-md text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 inline-flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Open Page
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId("");
                              handleDeleteRun(runId);
                            }}
                            disabled={!runId}
                            className="w-full h-8 px-2 rounded-md text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1"><span className="text-green-600 font-semibold">{run.passedTests || 0}</span><span className="text-[#232323]/55 dark:text-white/55">passed</span></div>
                    {!!run.failedTests && <div className="flex items-center gap-1"><span className="text-red-600 font-semibold">{run.failedTests}</span><span className="text-[#232323]/55 dark:text-white/55">failed</span></div>}
                    {!!run.skippedTests && <div className="flex items-center gap-1"><span className="text-[#232323]/70 dark:text-white/70 font-semibold">{run.skippedTests}</span><span className="text-[#232323]/55 dark:text-white/55">skipped</span></div>}
                    <span className="text-[#232323]/35 dark:text-white/35">•</span>
                    <span className="text-[#232323]/70 dark:text-white/70">{run.totalTests || 0} total</span>
                    {!!run.duration && (
                      <>
                        <span className="text-[#232323]/35 dark:text-white/35">•</span>
                        <span className="text-[#232323]/70 dark:text-white/70">{formatDuration(run.duration)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-[#232323]/55 dark:text-white/55">
                    <span className="h-6 px-2 rounded-md border border-black/10 dark:border-white/15 bg-background/70 inline-flex items-center">{run.environment || "staging"}</span>
                    {run.triggeredBy?.name ? (
                      <span className="inline-flex items-center gap-1.5 ml-auto">
                        <span className="w-5 h-5 rounded-full bg-[#FFAA00]/20 text-[10px] font-semibold text-[#232323] dark:text-white inline-flex items-center justify-center">{String(run.triggeredBy.name).charAt(0).toUpperCase()}</span>
                        {run.triggeredBy.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <RunDetailsModal
        open={detailsModalOpen}
        orgSlug={orgSlug}
        runId={selectedRunId}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedRunId("");
        }}
      />
    </DashboardLayout>
  );
}

