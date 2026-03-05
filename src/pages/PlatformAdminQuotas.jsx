import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, BarChart3, RefreshCw, Search, ShieldCheck, Sparkles } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchAdminQuotaOrganizations, resetAllAdminQuotas, updateAdminOrgQuota } from "../services/organizations";

function usageItem(usage, feature) {
  const rows = Array.isArray(usage) ? usage : [];
  return rows.find((item) => item?.feature === feature) || { used: 0, limit: 0, remaining: 0 };
}

function buildQuotaFormRow(row, defaultPlanId) {
  const subscription = row?.subscription || {};
  const usage = Array.isArray(row?.usage) ? row.usage : [];

  return {
    planId: subscription?.planId || defaultPlanId || "",
    customMonthlyFunctionalGenerations: Number(subscription?.customMonthlyFunctionalGenerations ?? usageItem(usage, "FunctionalGeneration")?.limit ?? 0),
    customMonthlyWebTestRuns: Number(subscription?.customMonthlyWebTestRuns ?? usageItem(usage, "WebTestRun")?.limit ?? 0),
    customMonthlyFunctionalInputTokens: Number(subscription?.customMonthlyFunctionalInputTokens ?? usageItem(usage, "FunctionalInputTokens")?.limit ?? 0),
    customMonthlyFunctionalOutputTokens: Number(subscription?.customMonthlyFunctionalOutputTokens ?? usageItem(usage, "FunctionalOutputTokens")?.limit ?? 0),
    customMaxParallelWebRuns: Number(subscription?.customMaxParallelWebRuns ?? subscription?.plan?.maxParallelWebRuns ?? 4),
  };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getOperationRows(aiUsage) {
  const operations = aiUsage?.operations && typeof aiUsage.operations === "object" ? aiUsage.operations : {};
  return Object.entries(operations)
    .map(([operation, stats]) => {
      const inputTokens = Number(stats?.inputTokens || 0);
      const outputTokens = Number(stats?.outputTokens || 0);
      const generations = Number(stats?.generations || 0);
      const llmCalls = Number(stats?.llmCalls || 0);
      return {
        operation,
        inputTokens,
        outputTokens,
        generations,
        llmCalls,
        totalTokens: inputTokens + outputTokens,
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

function getBreakdownRows(collection) {
  const map = collection && typeof collection === "object" ? collection : {};
  return Object.entries(map)
    .map(([name, stats]) => {
      const inputTokens = Number(stats?.inputTokens || 0);
      const outputTokens = Number(stats?.outputTokens || 0);
      const llmCalls = Number(stats?.llmCalls || 0);
      return {
        name,
        inputTokens,
        outputTokens,
        llmCalls,
        totalTokens: inputTokens + outputTokens,
      };
    })
    .filter((row) => {
      const normalized = String(row?.name || "").trim().toLowerCase();
      const isUnknown = normalized === "unknown";
      const hasValues = Number(row?.totalTokens || 0) > 0 || Number(row?.llmCalls || 0) > 0;
      return !isUnknown || hasValues;
    })
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 3);
}

export default function PlatformAdminQuotas() {
  const { orgSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(true);
  const [search, setSearch] = useState("");
  const [defaultPlanId, setDefaultPlanId] = useState("");
  const [rows, setRows] = useState([]);
  const [formBySlug, setFormBySlug] = useState({});
  const [savingSlug, setSavingSlug] = useState("");
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resettingAll, setResettingAll] = useState(false);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const usage = Array.isArray(row?.usage) ? row.usage : [];
        const ai = usageItem(usage, "FunctionalGeneration");
        const web = usageItem(usage, "WebTestRun");
        const aiUsage = row?.statistics?.aiUsage || {};

        acc.organizations += 1;
        acc.aiUsed += Number(ai.used || 0);
        acc.aiLimit += Number(ai.limit || 0);
        acc.webUsed += Number(web.used || 0);
        acc.webLimit += Number(web.limit || 0);
        acc.totalLlmCalls += Number(aiUsage?.totalLlmCalls || 0);
        return acc;
      },
      { organizations: 0, aiUsed: 0, aiLimit: 0, webUsed: 0, webLimit: 0, totalLlmCalls: 0 },
    );
  }, [rows]);

  async function loadOverview(searchValue = "") {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminQuotaOrganizations({ search: searchValue, limit: 200 });
      const nextRows = Array.isArray(data?.organizations) ? data.organizations : [];
      const nextDefaultPlanId = String(data?.defaultPlanId || "");
      setDefaultPlanId(nextDefaultPlanId);
      setRows(nextRows);
      setHasAccess(true);

      setFormBySlug((prev) => {
        const next = { ...prev };
        nextRows.forEach((row) => {
          const slug = row?.organization?.slug;
          if (!slug || next[slug]) return;
          next[slug] = buildQuotaFormRow(row, nextDefaultPlanId);
        });
        return next;
      });
    } catch (e) {
      if (Number(e?.status || 0) === 401 || Number(e?.status || 0) === 403) {
        setHasAccess(false);
        setRows([]);
        return;
      }
      setError(e?.message || "Failed to load admin quota overview");
    } finally {
      setLoading(false);
    }
  }

  async function saveQuota(row) {
    const slug = row?.organization?.slug;
    if (!slug) return;

    const form = formBySlug[slug] || buildQuotaFormRow(row, defaultPlanId);
    const payload = {
      planId: form.planId || row?.subscription?.planId || defaultPlanId,
      status: row?.subscription?.status || "Active",
      customMonthlyFunctionalGenerations: Math.max(0, Number(form.customMonthlyFunctionalGenerations || 0)),
      customMonthlyWebTestRuns: Math.max(0, Number(form.customMonthlyWebTestRuns || 0)),
      customMonthlyFunctionalInputTokens: Math.max(0, Number(form.customMonthlyFunctionalInputTokens || 0)),
      customMonthlyFunctionalOutputTokens: Math.max(0, Number(form.customMonthlyFunctionalOutputTokens || 0)),
      customMaxParallelWebRuns: Math.max(0, Number(form.customMaxParallelWebRuns || 0)),
    };

    setSavingSlug(slug);
    setError("");
    try {
      await updateAdminOrgQuota(slug, payload);
      await loadOverview(search);
    } catch (e) {
      setError(e?.message || `Failed to update quota for ${slug}`);
    } finally {
      setSavingSlug("");
    }
  }

  async function resetAllQuotasAndTokens() {
    if (resetConfirmText.trim().toUpperCase() !== "RESET") {
      setError('Type "RESET" to confirm full reset.');
      return;
    }

    setResettingAll(true);
    setError("");
    try {
      await resetAllAdminQuotas({
        resetLimits: true,
        resetUsageHistory: true,
        reason: "super_admin_manual_reset",
      });
      setResetConfirmText("");
      await loadOverview(search);
    } catch (e) {
      setError(e?.message || "Failed to reset all quotas/tokens");
    } finally {
      setResettingAll(false);
    }
  }

  useEffect(() => {
    loadOverview("");
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-3 md:px-5 py-4 md:py-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[2rem] leading-tight font-bold text-[#232323] dark:text-white inline-flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-[#FFAA00]" />
              Super Admin Quotas
            </h2>
            <p className="text-[#232323]/60 dark:text-white/60 mt-1">
              Manage organization limits and monitor AI/Web consumption in one place.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-card/90 px-3 py-2 text-xs font-medium text-[#232323]/70 dark:text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-[#FFAA00]" />
            Current org: {orgSlug}
          </span>
        </div>

        {!hasAccess ? (
          <div className="rounded-2xl border border-red-300/70 dark:border-red-700/40 bg-red-50/30 dark:bg-red-950/15 p-5 text-red-700 dark:text-red-300">
            Super admin access required for this page.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="text-sm text-[#232323]/60 dark:text-white/60">Organizations</p>
                <p className="text-2xl font-bold text-[#232323] dark:text-white mt-2">{formatNumber(summary.organizations)}</p>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="text-sm text-[#232323]/60 dark:text-white/60">AI Quota Usage</p>
                <p className="text-2xl font-bold text-[#232323] dark:text-white mt-2">
                  {formatNumber(summary.aiUsed)} / {formatNumber(summary.aiLimit)}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="text-sm text-[#232323]/60 dark:text-white/60">Web Quota Usage</p>
                <p className="text-2xl font-bold text-[#232323] dark:text-white mt-2">
                  {formatNumber(summary.webUsed)} / {formatNumber(summary.webLimit)}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="text-sm text-[#232323]/60 dark:text-white/60">LLM Calls (All Orgs)</p>
                <p className="text-2xl font-bold text-[#232323] dark:text-white mt-2">{formatNumber(summary.totalLlmCalls)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-300/70 dark:border-red-700/40 bg-red-50/30 dark:bg-red-950/15 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Reset All Quotas & Tokens
                  </p>
                  <p className="text-sm text-[#232323]/70 dark:text-white/70 mt-1">
                    This clears all organizations usage counters/events and resets all custom quota limits to 0.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder='Type "RESET"'
                    className="h-9 w-40 rounded-lg border border-red-300/70 dark:border-red-700/40 px-3 bg-background/80 text-sm"
                  />
                  <button
                    type="button"
                    onClick={resetAllQuotasAndTokens}
                    disabled={resettingAll || resetConfirmText.trim().toUpperCase() !== "RESET"}
                    className="h-9 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {resettingAll ? "Resetting..." : "Reset All"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#232323] dark:text-white inline-flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Organization Quota Matrix
                  </h3>
                  <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-0.5">Set monthly limits and save per organization.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 text-[#232323]/45 dark:text-white/45 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search organization"
                      className="h-9 w-56 rounded-lg border border-black/15 dark:border-white/15 pl-8 pr-3 bg-background/80 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => loadOverview(search)}
                    className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {error ? <p className="px-5 py-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-black/[0.03] dark:bg-white/[0.03] text-[#232323]/70 dark:text-white/70">
                    <tr>
                      <th className="text-left px-4 py-2">Organization</th>
                      <th className="text-left px-4 py-2">AI Quota</th>
                      <th className="text-left px-4 py-2">Web Quota</th>
                      <th className="text-left px-4 py-2">Runs</th>
                      <th className="text-left px-4 py-2">AI Cases</th>
                      <th className="text-left px-4 py-2">Input Tok</th>
                      <th className="text-left px-4 py-2">Output Tok</th>
                      <th className="text-left px-4 py-2">LLM Calls</th>
                      <th className="text-left px-4 py-2">Models</th>
                      <th className="text-left px-4 py-2">Operation Tokens</th>
                      <th className="text-left px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const slug = row?.organization?.slug;
                      const usage = Array.isArray(row?.usage) ? row.usage : [];
                      const ai = usageItem(usage, "FunctionalGeneration");
                      const web = usageItem(usage, "WebTestRun");
                      const aiUsage = row?.statistics?.aiUsage || {};
                      const form = formBySlug[slug] || buildQuotaFormRow(row, defaultPlanId);
                      const operationRows = getOperationRows(aiUsage);
                      const modelRows = getBreakdownRows(aiUsage?.models);
                      const functionalCalls = Number(aiUsage?.channels?.functional?.llmCalls || 0);
                      const webCalls = Number(aiUsage?.channels?.web?.llmCalls || 0);
                      const totalCalls = Number(aiUsage?.totalLlmCalls || 0);

                      return (
                        <tr key={slug} className="border-t border-black/10 dark:border-white/10 align-top">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#232323] dark:text-white">{row?.organization?.name || slug}</p>
                            <p className="text-xs text-[#232323]/60 dark:text-white/60">{slug}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[#232323]/60 dark:text-white/60 mb-1">{ai.used}/{ai.limit} used</p>
                            <input
                              type="number"
                              min="0"
                              value={form.customMonthlyFunctionalGenerations}
                              onChange={(e) =>
                                setFormBySlug((prev) => ({
                                  ...prev,
                                  [slug]: {
                                    ...form,
                                    customMonthlyFunctionalGenerations: Number(e.target.value || 0),
                                  },
                                }))
                              }
                              className="h-8 w-28 rounded-md border border-black/15 dark:border-white/15 px-2 bg-background/80"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[#232323]/60 dark:text-white/60 mb-1">{web.used}/{web.limit} used</p>
                            <input
                              type="number"
                              min="0"
                              value={form.customMonthlyWebTestRuns}
                              onChange={(e) =>
                                setFormBySlug((prev) => ({
                                  ...prev,
                                  [slug]: {
                                    ...form,
                                    customMonthlyWebTestRuns: Number(e.target.value || 0),
                                  },
                                }))
                              }
                              className="h-8 w-28 rounded-md border border-black/15 dark:border-white/15 px-2 bg-background/80"
                            />
                          </td>
                          <td className="px-4 py-3">{formatNumber(row?.statistics?.testRunsThisCycle || 0)}</td>
                          <td className="px-4 py-3">{formatNumber(row?.statistics?.aiGeneratedTestCasesThisCycle || 0)}</td>
                          <td className="px-4 py-3">{formatNumber(aiUsage?.totalInputTokens || 0)}</td>
                          <td className="px-4 py-3">{formatNumber(aiUsage?.totalOutputTokens || 0)}</td>
                          <td className="px-4 py-3 min-w-[140px]">
                            <p className="text-xs font-semibold text-[#232323] dark:text-white">{formatNumber(totalCalls)}</p>
                            <p className="text-[11px] text-[#232323]/65 dark:text-white/65 mt-0.5">
                              Func: {formatNumber(functionalCalls)} • Web: {formatNumber(webCalls)}
                            </p>
                          </td>
                          <td className="px-4 py-3 min-w-[260px]">
                            {modelRows.length > 0 ? (
                              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                {modelRows.map((item) => (
                                  <p key={`${slug}-model-${item.name}`} className="text-[11px] text-[#232323]/70 dark:text-white/70 truncate">
                                    Model {item.name}: {formatNumber(item.llmCalls)} calls, {formatNumber(item.totalTokens)} tok
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-[#232323]/55 dark:text-white/55">No model data</span>
                            )}
                          </td>
                          <td className="px-4 py-3 min-w-[320px]">
                            {operationRows.length > 0 ? (
                              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                {operationRows.map((operationRow) => (
                                  <div
                                    key={`${slug}-${operationRow.operation}`}
                                    className="rounded-md border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] px-2 py-1.5"
                                  >
                                    <p className="text-xs font-semibold text-[#232323] dark:text-white capitalize truncate">
                                      {operationRow.operation.replace(/[_-]+/g, " ")}
                                    </p>
                                    <p className="text-[11px] text-[#232323]/65 dark:text-white/65 mt-0.5">
                                      In: {formatNumber(operationRow.inputTokens)} • Out: {formatNumber(operationRow.outputTokens)} • Calls: {formatNumber(operationRow.llmCalls)} • Total: {formatNumber(operationRow.totalTokens)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-[#232323]/55 dark:text-white/55">No operation token data</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => saveQuota(row)}
                              disabled={savingSlug === slug || !slug}
                              className="h-8 px-3 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60"
                            >
                              {savingSlug === slug ? "Saving..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && rows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center text-sm text-[#232323]/60 dark:text-white/60">
                          No organizations found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
