import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Globe,
  Layers,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchTestProjects } from "../services/testManagement";
import {
  listApiTests,
  createApiTest,
  updateApiTest,
  deleteApiTest,
  executeApiTest,
  listApiTestExecutions,
} from "../services/platform";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const METHOD_COLORS = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  PATCH: "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-violet-500/20",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400 ring-red-500/20",
  HEAD: "bg-slate-500/15 text-slate-600 dark:text-slate-400 ring-slate-500/20",
  OPTIONS: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20",
};
const METHOD_DOT = {
  GET: "bg-emerald-500", POST: "bg-blue-500", PUT: "bg-amber-500",
  PATCH: "bg-violet-500", DELETE: "bg-red-500", HEAD: "bg-slate-500", OPTIONS: "bg-cyan-500",
};
const ASSERTION_TYPES = [
  { value: "status", label: "Status Code" },
  { value: "responseTime", label: "Response Time (ms)" },
  { value: "header", label: "Header Value" },
  { value: "body", label: "JSON Body Path" },
  { value: "bodyContains", label: "Body Contains" },
];
const OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "contains", label: "contains" },
  { value: "notContains", label: "not contains" },
  { value: "matches", label: "matches regex" },
  { value: "exists", label: "exists" },
];
const BODY_TYPES = [
  { value: "json", label: "JSON" },
  { value: "form", label: "Form Data" },
  { value: "raw", label: "Raw" },
  { value: "none", label: "None" },
];

function StatusBadge({ status }) {
  if (status === "passed") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="h-3 w-3" /> Passed
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
      <XCircle className="h-3 w-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" /> {status || "Pending"}
    </span>
  );
}

function MethodBadge({ method }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md ring-1 ${METHOD_COLORS[method] || "bg-slate-100 dark:bg-slate-800 ring-slate-500/20"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${METHOD_DOT[method] || "bg-slate-500"}`} />
      {method}
    </span>
  );
}

function KvEditor({ rows, onChange, keyPlaceholder = "Key", valuePlaceholder = "Value" }) {
  const addRow = () => onChange([...rows, { key: "", value: "" }]);
  const updateRow = (i, field, val) => { const next = [...rows]; next[i] = { ...next[i], [field]: val }; onChange(next); };
  const removeRow = (i) => onChange(rows.length > 1 ? rows.filter((_, j) => j !== i) : [{ key: "", value: "" }]);
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={r.key} onChange={(e) => updateRow(i, "key", e.target.value)} placeholder={keyPlaceholder}
            className="flex-1 h-8 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 transition-shadow" />
          <input value={r.value} onChange={(e) => updateRow(i, "value", e.target.value)} placeholder={valuePlaceholder}
            className="flex-1 h-8 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 transition-shadow" />
          <button onClick={() => removeRow(i)} className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button onClick={addRow} className="text-xs font-medium text-[#FFAA00] hover:text-[#FFAA00]/80 transition-colors">+ Add row</button>
    </div>
  );
}

function TabButton({ active, label, count, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative px-3.5 py-2 text-xs font-semibold transition-colors ${
        active ? "text-[#FFAA00] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#FFAA00] after:rounded-full"
          : "text-[#232323]/50 dark:text-white/50 hover:text-[#232323]/80 dark:hover:text-white/80"
      }`}>
      {label}
      {count > 0 && (
        <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
          active ? "bg-[#FFAA00]/20 text-[#FFAA00]" : "bg-black/5 dark:bg-white/10 text-[#232323]/50 dark:text-white/50"
        }`}>{count}</span>
      )}
    </button>
  );
}

export default function ApiTests() {
  const { orgSlug } = useParams();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [builderTab, setBuilderTab] = useState("params");
  const [form, setForm] = useState({
    name: "", description: "", httpMethod: "GET", url: "",
    headers: {}, queryParams: {}, body: null, bodyType: "json",
    assertions: [], timeout: 30000,
  });
  const [headerRows, setHeaderRows] = useState([{ key: "", value: "" }]);
  const [paramRows, setParamRows] = useState([{ key: "", value: "" }]);
  const [running, setRunning] = useState(null);
  const [execResult, setExecResult] = useState(null);
  const [executions, setExecutions] = useState({});
  const [expandedTest, setExpandedTest] = useState(null);
  const [resultTab, setResultTab] = useState("body");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!orgSlug) return;
    fetchTestProjects(orgSlug).then((p) => {
      const arr = Array.isArray(p) ? p : [];
      setProjects(arr);
      if (arr.length && !projectId) setProjectId(arr[0].id);
    }).catch(() => {});
  }, [orgSlug]);

  const loadTests = useCallback(async () => {
    if (!orgSlug || !projectId) { setTests([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await listApiTests(orgSlug, projectId);
      setTests(Array.isArray(data) ? data : []);
    } catch (e) { setError(e?.message || "Failed to load API tests"); }
    finally { setLoading(false); }
  }, [orgSlug, projectId]);

  useEffect(() => { loadTests(); }, [loadTests]);

  const kvToObj = (rows) => { const obj = {}; rows.forEach((r) => { if (r.key.trim()) obj[r.key.trim()] = r.value; }); return obj; };
  const objToKv = (obj) => { const entries = Object.entries(obj || {}); return entries.length ? entries.map(([key, value]) => ({ key, value: String(value) })) : [{ key: "", value: "" }]; };
  const activeHeaderCount = headerRows.filter(r => r.key.trim()).length;
  const activeParamCount = paramRows.filter(r => r.key.trim()).length;

  const resetForm = () => {
    setForm({ name: "", description: "", httpMethod: "GET", url: "", headers: {}, queryParams: {}, body: null, bodyType: "json", assertions: [], timeout: 30000 });
    setHeaderRows([{ key: "", value: "" }]); setParamRows([{ key: "", value: "" }]);
    setShowForm(false); setEditId(null); setExecResult(null); setBuilderTab("params");
  };

  const startEdit = (t) => {
    setEditId(t.id);
    setForm({ name: t.name, description: t.description || "", httpMethod: t.httpMethod, url: t.url, headers: t.headers || {}, queryParams: t.queryParams || {}, body: t.body, bodyType: t.bodyType || "json", assertions: t.assertions || [], timeout: t.timeout || 30000 });
    setHeaderRows(objToKv(t.headers)); setParamRows(objToKv(t.queryParams));
    setShowForm(true); setBuilderTab("params");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    const payload = { ...form, headers: kvToObj(headerRows), queryParams: kvToObj(paramRows) };
    try {
      if (editId) await updateApiTest(orgSlug, projectId, editId, payload);
      else await createApiTest(orgSlug, projectId, payload);
      resetForm(); await loadTests();
    } catch (e) { setError(e?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleRun = async (testId) => {
    setRunning(testId); setExecResult(null);
    try {
      const result = await executeApiTest(orgSlug, projectId, testId);
      setExecResult(result); setExpandedTest(testId); setResultTab("body");
      const execs = await listApiTestExecutions(orgSlug, projectId, testId);
      setExecutions((prev) => ({ ...prev, [testId]: Array.isArray(execs) ? execs : [] }));
    } catch (e) { setError(e?.message || "Execution failed"); }
    finally { setRunning(null); }
  };

  const handleDelete = async (testId) => {
    try { await deleteApiTest(orgSlug, projectId, testId); setDeleteConfirm(null); await loadTests(); }
    catch (e) { setError(e?.message || "Failed to delete"); }
  };

  const toggleExpandTest = async (testId) => {
    if (expandedTest === testId) { setExpandedTest(null); return; }
    setExpandedTest(testId);
    if (!executions[testId]) {
      try { const execs = await listApiTestExecutions(orgSlug, projectId, testId); setExecutions((prev) => ({ ...prev, [testId]: Array.isArray(execs) ? execs : [] })); } catch {}
    }
  };

  const addAssertion = () => setForm((p) => ({ ...p, assertions: [...p.assertions, { type: "status", operator: "eq", expected: "200" }] }));
  const updateAssertion = (i, field, value) => setForm((p) => { const a = [...p.assertions]; a[i] = { ...a[i], [field]: value }; return { ...p, assertions: a }; });
  const removeAssertion = (i) => setForm((p) => ({ ...p, assertions: p.assertions.filter((_, j) => j !== i) }));

  const totalTests = tests.length;

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 overflow-y-auto max-w-[1200px] mx-auto space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#FFAA00]/20 to-[#FFAA00]/5 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#FFAA00]" />
              </div>
              <h1 className="text-2xl font-bold text-[#232323] dark:text-white tracking-tight">API Tests</h1>
            </div>
            <p className="text-sm text-[#232323]/55 dark:text-white/55 max-w-lg">Build, execute & validate structured API test cases with assertions and execution history.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                className="h-9 min-w-[180px] appearance-none rounded-lg border border-black/8 dark:border-white/12 bg-white dark:bg-white/5 pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 transition-shadow">
                <option value="" disabled>Select a project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#232323]/40 dark:text-white/40" />
            </div>
            <button type="button" onClick={() => { resetForm(); setShowForm(true); }}
              className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold shadow-sm shadow-[#FFAA00]/20 inline-flex items-center gap-2 transition-all hover:shadow-md hover:shadow-[#FFAA00]/25">
              <Plus className="h-3.5 w-3.5" /> New Test
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50/80 dark:bg-red-900/10 backdrop-blur-sm p-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Stats */}
        {!loading && tests.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Tests", value: totalTests, icon: Layers, accent: "text-blue-500 bg-blue-500/10" },
              { label: "Methods Used", value: [...new Set(tests.map(t => t.httpMethod))].length, icon: Globe, accent: "text-violet-500 bg-violet-500/10" },
              { label: "With Assertions", value: tests.filter(t => t.assertions?.length > 0).length, icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="rounded-xl border border-black/6 dark:border-white/8 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent}`}><Icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-lg font-bold text-[#232323] dark:text-white">{value}</p>
                  <p className="text-[11px] text-[#232323]/45 dark:text-white/45 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Builder */}
        {showForm && (
          <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#13112a] shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-6 py-4 border-b border-black/6 dark:border-white/8 flex items-center justify-between bg-gradient-to-r from-transparent to-[#FFAA00]/[0.03]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#FFAA00]/10 flex items-center justify-center"><Code2 className="h-4 w-4 text-[#FFAA00]" /></div>
                <p className="font-semibold text-[#232323] dark:text-white">{editId ? "Edit API Test" : "New API Test"}</p>
              </div>
              <button type="button" onClick={resetForm} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/8 transition-colors"><X className="h-4 w-4 text-[#232323]/50 dark:text-white/50" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">Test Name *</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Login Endpoint"
                    className="w-full h-10 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 focus:border-[#FFAA00]/40 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">Description</label>
                  <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description"
                    className="w-full h-10 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 focus:border-[#FFAA00]/40 transition-all" />
                </div>
              </div>

              {/* Method + URL bar */}
              <div className="flex gap-0 rounded-xl border border-black/8 dark:border-white/10 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#FFAA00]/30 transition-shadow">
                <select value={form.httpMethod} onChange={(e) => setForm((p) => ({ ...p, httpMethod: e.target.value }))}
                  className={`h-11 w-[120px] shrink-0 border-r border-black/8 dark:border-white/10 px-3 text-xs font-bold focus:outline-none ${(METHOD_COLORS[form.httpMethod] || "").split(" ").slice(0,2).join(" ")}`}>
                  {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://api.example.com/v1/endpoint"
                  className="flex-1 h-11 bg-white dark:bg-white/5 px-4 text-sm font-mono focus:outline-none placeholder:text-[#232323]/30 dark:placeholder:text-white/25" />
                <div className="flex items-center px-3 bg-white dark:bg-white/5 border-l border-black/8 dark:border-white/10">
                  <span className="text-[10px] font-medium text-[#232323]/40 dark:text-white/35">Timeout:</span>
                  <input value={form.timeout} onChange={(e) => setForm((p) => ({ ...p, timeout: parseInt(e.target.value) || 30000 }))}
                    className="w-14 h-7 ml-1.5 text-center rounded-md border border-black/8 dark:border-white/10 bg-transparent text-xs font-mono focus:outline-none" />
                  <span className="text-[10px] text-[#232323]/35 dark:text-white/30 ml-1">ms</span>
                </div>
              </div>

              {/* Request Tabs */}
              <div>
                <div className="flex items-center border-b border-black/6 dark:border-white/8 -mx-1">
                  <TabButton active={builderTab === "params"} label="Params" count={activeParamCount} onClick={() => setBuilderTab("params")} />
                  <TabButton active={builderTab === "headers"} label="Headers" count={activeHeaderCount} onClick={() => setBuilderTab("headers")} />
                  {form.httpMethod !== "GET" && form.httpMethod !== "HEAD" && (
                    <TabButton active={builderTab === "body"} label="Body" count={form.body ? 1 : 0} onClick={() => setBuilderTab("body")} />
                  )}
                  <TabButton active={builderTab === "assertions"} label="Assertions" count={form.assertions.length} onClick={() => setBuilderTab("assertions")} />
                </div>
                <div className="pt-4">
                  {builderTab === "params" && <KvEditor rows={paramRows} onChange={setParamRows} keyPlaceholder="Parameter name" valuePlaceholder="Value" />}
                  {builderTab === "headers" && <KvEditor rows={headerRows} onChange={setHeaderRows} keyPlaceholder="Header name" valuePlaceholder="Value" />}
                  {builderTab === "body" && form.httpMethod !== "GET" && form.httpMethod !== "HEAD" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {BODY_TYPES.map((bt) => (
                          <button key={bt.value} type="button" onClick={() => setForm((p) => ({ ...p, bodyType: bt.value }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${form.bodyType === bt.value ? "bg-[#FFAA00]/15 text-[#FFAA00] ring-1 ring-[#FFAA00]/25" : "text-[#232323]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"}`}>
                            {bt.label}
                          </button>
                        ))}
                      </div>
                      {form.bodyType !== "none" && (
                        <textarea value={form.body ? (typeof form.body === "string" ? form.body : JSON.stringify(form.body, null, 2)) : ""}
                          onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} rows={6}
                          placeholder={form.bodyType === "json" ? '{\n  "key": "value"\n}' : "Request body..."}
                          className="w-full rounded-lg border border-black/8 dark:border-white/10 bg-[#1a1a2e] text-emerald-400 px-4 py-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 leading-relaxed" />
                      )}
                    </div>
                  )}
                  {builderTab === "assertions" && (
                    <div className="space-y-3">
                      {form.assertions.length === 0 && (
                        <div className="text-center py-6 text-sm text-[#232323]/40 dark:text-white/35">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p>No assertions yet. Add one to validate responses.</p>
                        </div>
                      )}
                      {form.assertions.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-black/6 dark:border-white/8 bg-white/50 dark:bg-white/[0.02]">
                          <select value={a.type} onChange={(e) => updateAssertion(i, "type", e.target.value)}
                            className="h-8 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30">
                            {ASSERTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          {(a.type === "header" || a.type === "body") && (
                            <input value={a.path || ""} onChange={(e) => updateAssertion(i, "path", e.target.value)}
                              placeholder={a.type === "header" ? "Header name" : "data.id"}
                              className="h-8 w-28 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30" />
                          )}
                          <select value={a.operator} onChange={(e) => updateAssertion(i, "operator", e.target.value)}
                            className="h-8 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30">
                            {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <input value={a.expected ?? ""} onChange={(e) => updateAssertion(i, "expected", e.target.value)} placeholder="Expected value"
                            className="flex-1 h-8 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30" />
                          <button onClick={() => removeAssertion(i)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      <button onClick={addAssertion} className="text-xs font-semibold text-[#FFAA00] hover:text-[#FFAA00]/80 inline-flex items-center gap-1.5 transition-colors"><Plus className="h-3 w-3" /> Add Assertion</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/6 dark:border-white/8">
                <button type="button" onClick={resetForm} className="h-9 px-5 rounded-lg border border-black/10 dark:border-white/12 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving || !form.name.trim() || !form.url.trim()}
                  className="h-9 px-5 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold shadow-sm shadow-[#FFAA00]/20 disabled:opacity-50 inline-flex items-center gap-2 transition-all">
                  <Check className="h-3.5 w-3.5" /> {editId ? "Update Test" : "Create Test"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#FFAA00] border-t-transparent" />
              <p className="text-xs text-[#232323]/40 dark:text-white/40 font-medium">Loading API tests...</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && tests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#FFAA00]/10 flex items-center justify-center mb-5">
              <Globe className="h-7 w-7 text-[#FFAA00]/60" />
            </div>
            <p className="text-lg font-bold text-[#232323] dark:text-white">No API tests yet</p>
            <p className="text-sm text-[#232323]/50 dark:text-white/50 mt-1.5 max-w-sm">Create your first API test case to start validating your endpoints with assertions.</p>
            <button type="button" onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-5 h-9 px-5 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-all">
              <Plus className="h-3.5 w-3.5" /> Create First Test
            </button>
          </div>
        )}

        {/* Test List */}
        {!loading && tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((t) => {
              const isExpanded = expandedTest === t.id;
              const lastExec = executions[t.id]?.[0];
              return (
                <div key={t.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded ? "border-[#FFAA00]/30 shadow-lg shadow-[#FFAA00]/5 bg-white dark:bg-[#13112a]"
                    : "border-black/6 dark:border-white/8 bg-white/80 dark:bg-[#13112a]/80 hover:border-black/12 dark:hover:border-white/12 hover:shadow-md"
                }`}>
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpandTest(t.id)}>
                      <ChevronRight className={`h-4 w-4 text-[#232323]/30 dark:text-white/30 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                      <MethodBadge method={t.httpMethod} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#232323] dark:text-white text-sm truncate">{t.name}</p>
                          {lastExec && <StatusBadge status={lastExec.status} />}
                        </div>
                        <p className="text-xs text-[#232323]/40 dark:text-white/40 font-mono truncate mt-0.5">{t.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => handleRun(t.id)} disabled={running === t.id}
                        className="h-8 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-[#FFAA00]/15 transition-all">
                        {running === t.id ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#232323] border-t-transparent" /> : <Send className="h-3 w-3" />}
                        Run
                      </button>
                      <button type="button" onClick={() => startEdit(t)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[#232323]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/8 transition-colors" title="Edit">
                        <Code2 className="h-3.5 w-3.5" />
                      </button>
                      {deleteConfirm === t.id ? (
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleDelete(t.id)} className="h-7 px-2.5 rounded-lg bg-red-500 text-white text-[11px] font-bold">Confirm</button>
                          <button type="button" onClick={() => setDeleteConfirm(null)} className="h-7 px-2.5 rounded-lg border border-black/10 dark:border-white/12 text-[11px] font-medium">Cancel</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setDeleteConfirm(t.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-black/6 dark:border-white/8">
                      {execResult && execResult.apiTestCaseId === t.id && (
                        <div className="px-6 py-5 border-b border-black/6 dark:border-white/8 bg-gradient-to-b from-[#f8f8fa] dark:from-[#16142e] to-transparent">
                          <div className="flex items-center gap-4 mb-4">
                            <StatusBadge status={execResult.status} />
                            <div className="flex items-center gap-3 text-xs text-[#232323]/55 dark:text-white/55">
                              <span className="inline-flex items-center gap-1 font-mono"><span className="font-semibold text-[#232323] dark:text-white">{execResult.statusCode}</span> status</span>
                              <span className="text-[#232323]/20 dark:text-white/20">|</span>
                              <span className="inline-flex items-center gap-1 font-mono"><Clock className="h-3 w-3" /><span className="font-semibold text-[#232323] dark:text-white">{execResult.responseTime}</span>ms</span>
                            </div>
                          </div>
                          {execResult.assertionResults?.length > 0 && (
                            <div className="mb-4 space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/40 dark:text-white/40 mb-2">Assertions</p>
                              {execResult.assertionResults.map((a, i) => (
                                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${a.passed ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-red-500/5 border border-red-500/10"}`}>
                                  {a.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                                  <span className="font-medium text-[#232323]/70 dark:text-white/70">{a.type}</span>
                                  <span className="text-[#232323]/40 dark:text-white/40">{a.operator}</span>
                                  <span className="font-mono text-[#232323]/60 dark:text-white/60">{String(a.expected ?? "")}</span>
                                  <ArrowRight className="h-3 w-3 text-[#232323]/25 dark:text-white/20" />
                                  <span className="font-mono text-[#232323]/50 dark:text-white/50">{String(a.actual ?? "")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-0 border-b border-black/6 dark:border-white/8 mb-3">
                            <TabButton active={resultTab === "body"} label="Response Body" onClick={() => setResultTab("body")} />
                            <TabButton active={resultTab === "headers"} label="Headers" onClick={() => setResultTab("headers")} />
                          </div>
                          {resultTab === "body" && execResult.responseBody && (
                            <pre className="text-[11px] font-mono bg-[#1a1a2e] text-emerald-400/90 rounded-lg p-4 max-h-48 overflow-auto whitespace-pre-wrap break-all leading-relaxed">
                              {typeof execResult.responseBody === "string" ? execResult.responseBody : JSON.stringify(execResult.responseBody, null, 2)}
                            </pre>
                          )}
                          {resultTab === "headers" && execResult.responseHeaders && (
                            <div className="space-y-1">
                              {Object.entries(typeof execResult.responseHeaders === "object" ? execResult.responseHeaders : {}).map(([k, v]) => (
                                <div key={k} className="flex items-center gap-2 text-xs font-mono">
                                  <span className="text-[#FFAA00]/70 font-semibold">{k}:</span>
                                  <span className="text-[#232323]/60 dark:text-white/60">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="px-6 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/40 dark:text-white/40 mb-3">Execution History</p>
                        {(executions[t.id] || []).length > 0 ? (
                          <div className="space-y-1.5">
                            {executions[t.id].slice(0, 10).map((ex) => (
                              <div key={ex.id} className="flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-xs">
                                <StatusBadge status={ex.status} />
                                <span className="font-mono text-[#232323]/55 dark:text-white/55">{ex.statusCode}</span>
                                <span className="text-[#232323]/40 dark:text-white/40 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {ex.responseTime}ms</span>
                                <span className="text-[#232323]/30 dark:text-white/30 ml-auto text-[11px]">{new Date(ex.createdAt).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#232323]/35 dark:text-white/30 py-2">No executions yet. Click "Run" to execute this test.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}