import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Layers,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { listSchedules, createSchedule, updateSchedule, deleteSchedule } from "../services/platform";
import { listPlans } from "../services/executionReporting";
import { useLanguage } from "../utils/language-context";

const TIMEZONES = [
  { value: "Africa/Casablanca", label: "Morocco", flag: "🇲🇦" },
  { value: "Europe/Paris", label: "France", flag: "🇫🇷" },
  { value: "Europe/Lisbon", label: "Portugal", flag: "🇵🇹" },
];

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startDay = (first.getDay() + 6) % 7; // Monday=0
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) days.push(d);
  return days;
}

function formatDateLabel(date) {
  if (!date) return "No date selected";
  return new Date(date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function dateToCron(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return `${mm} ${hh} ${d} ${m} *`;
}

function formatNextRun(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d - now;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const relative = diff > 0 ? (hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`) : "overdue";
  return `${d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} (${relative})`;
}

function formatLastRun(dateStr) {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Scheduling() {
  const { orgSlug } = useParams();
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [testPlans, setTestPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [form, setForm] = useState({
    name: "", scheduleDate: todayStr, scheduleTime: "02:00", timezone: "Europe/Paris",
    testPlanId: "", enabled: true, parallelSessions: 1,
  });
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  // Get selected project from localStorage
  const selectedProjectId = useMemo(() => {
    if (!orgSlug) return null;
    try {
      const stored = localStorage.getItem(`selectedProject_${orgSlug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.id || parsed;
      }
    } catch {}
    return null;
  }, [orgSlug]);

  // Load test plans filtered by selected project
  useEffect(() => {
    if (!orgSlug) return;
    setLoadingPlans(true);
    const opts = selectedProjectId ? { projectId: selectedProjectId } : {};
    listPlans(orgSlug, opts).then((plans) => {
      setTestPlans(Array.isArray(plans) ? plans : []);
    }).catch(() => setTestPlans([]))
      .finally(() => setLoadingPlans(false));
  }, [orgSlug, selectedProjectId]);

  const load = useCallback(async () => {
    if (!orgSlug) return;
    setLoading(true); setError(null);
    try {
      const data = await listSchedules(orgSlug);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) { setError(e?.message || "Failed to load schedules"); }
    finally { setLoading(false); }
  }, [orgSlug]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: "", scheduleDate: todayStr, scheduleTime: "02:00", timezone: "Europe/Paris", testPlanId: "", enabled: true, parallelSessions: 1 });
    setShowCreate(false); setEditId(null);
    setCalMonth(today.getMonth()); setCalYear(today.getFullYear());
  };

  const handleSave = async () => {
    const cron = dateToCron(form.scheduleDate, form.scheduleTime);
    if (!form.name.trim() || !cron || !form.testPlanId) return;
    setSaving(true);
    try {
      const payload = { ...form, cron };
      delete payload.scheduleDate;
      delete payload.scheduleTime;
      if (editId) await updateSchedule(orgSlug, editId, payload);
      else await createSchedule(orgSlug, payload);
      resetForm(); await load();
    } catch (e) { setError(e?.message || "Failed to save schedule"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (s) => {
    try { await updateSchedule(orgSlug, s.id, { enabled: !s.enabled }); await load(); }
    catch (e) { setError(e?.message || "Failed to toggle"); }
  };

  const handleDelete = async (id) => {
    try { await deleteSchedule(orgSlug, id); setDeleteConfirm(null); await load(); }
    catch (e) { setError(e?.message || "Failed to delete"); }
  };

  const cronToDateTime = (cron) => {
    if (!cron) return { date: todayStr, time: "02:00" };
    const parts = cron.split(" ");
    if (parts.length < 5) return { date: todayStr, time: "02:00" };
    const mm = String(parts[0]).padStart(2, "0");
    const hh = String(parts[1]).padStart(2, "0");
    const day = parts[2] !== "*" ? String(parts[2]).padStart(2, "0") : String(today.getDate()).padStart(2, "0");
    const month = parts[3] !== "*" ? String(parts[3]).padStart(2, "0") : String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return { date: `${year}-${month}-${day}`, time: `${hh}:${mm}` };
  };

  const startEdit = (s) => {
    setEditId(s.id);
    const { date, time } = cronToDateTime(s.cron);
    setForm({
      name: s.name, scheduleDate: date, scheduleTime: time,
      timezone: s.timezone || "Europe/Paris",
      testPlanId: s.testPlanId, enabled: s.enabled,
      parallelSessions: s.parallelSessions || 1,
    });
    const [y, m] = date.split("-").map(Number);
    setCalYear(y); setCalMonth(m - 1);
    setShowCreate(true);
  };

  const calDays = getMonthDays(calYear, calMonth);
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const selectDay = (d) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setForm(f => ({ ...f, scheduleDate: dateStr }));
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const [hourOpen, setHourOpen] = useState(false);
  const [minOpen, setMinOpen] = useState(false);

  const enabledCount = schedules.filter((s) => s.enabled).length;
  const totalRuns = schedules.reduce((sum, s) => sum + (s.runCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 overflow-y-auto w-full space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#FFAA00]/20 to-[#FFAA00]/5 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-[#FFAA00]" />
              </div>
              <h1 className="text-2xl font-bold text-[#232323] dark:text-white tracking-tight">{t("scheduling.title")}</h1>
            </div>
            <p className="text-sm text-[#232323]/55 dark:text-white/55 max-w-lg">
              {t("scheduling.subtitle")}
            </p>
          </div>
          <button type="button" onClick={() => { resetForm(); setShowCreate(true); }}
            className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold shadow-sm shadow-[#FFAA00]/20 inline-flex items-center gap-2 transition-all hover:shadow-md hover:shadow-[#FFAA00]/25">
            <Plus className="h-3.5 w-3.5" /> {t("scheduling.newSchedule")}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50/80 dark:bg-red-900/10 backdrop-blur-sm p-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Stats */}
        {!loading && schedules.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("scheduling.totalSchedules"), value: schedules.length, icon: Calendar, accent: "text-blue-500 bg-blue-500/10" },
              { label: t("scheduling.active"), value: enabledCount, icon: Play, accent: "text-emerald-500 bg-emerald-500/10" },
              { label: t("scheduling.paused"), value: schedules.length - enabledCount, icon: Pause, accent: "text-amber-500 bg-amber-500/10" },
              { label: t("scheduling.totalRuns"), value: totalRuns, icon: RotateCw, accent: "text-violet-500 bg-violet-500/10" },
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

        {/* Create / Edit Form */}
        {showCreate && (
          <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#13112a] shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-6 py-4 border-b border-black/6 dark:border-white/8 flex items-center justify-between bg-gradient-to-r from-transparent to-[#FFAA00]/[0.03]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#FFAA00]/10 flex items-center justify-center"><Calendar className="h-4 w-4 text-[#FFAA00]" /></div>
                <p className="font-semibold text-[#232323] dark:text-white">{editId ? t("scheduling.editSchedule") : t("scheduling.newSchedule")}</p>
              </div>
              <button type="button" onClick={resetForm} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/8 transition-colors">
                <X className="h-4 w-4 text-[#232323]/50 dark:text-white/50" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Row 1: Name + Test Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">{t("scheduling.scheduleName")} *</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Nightly Regression"
                    className="w-full h-10 rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 focus:border-[#FFAA00]/40 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">{t("scheduling.testPlan")} *</label>
                  <div className="relative">
                    <select value={form.testPlanId} onChange={(e) => setForm((p) => ({ ...p, testPlanId: e.target.value }))}
                      className="w-full h-10 appearance-none rounded-lg border border-black/8 dark:border-white/10 bg-white dark:bg-white/5 pl-3.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/30 focus:border-[#FFAA00]/40 transition-all">
                      <option value="">{t("scheduling.selectPlan")}</option>
                      {loadingPlans && <option disabled>Loading plans...</option>}
                      {testPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} {plan.environment ? `(${plan.environment})` : ""} {plan.testCases?.length ? `\u2014 ${plan.testCases.length} cases` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#232323]/40 dark:text-white/40" />
                  </div>
                  {testPlans.length === 0 && !loadingPlans && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">{t("scheduling.noPlanFound")}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Date & Time Picker + Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Calendar Date Picker */}
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">{t("scheduling.scheduleDate")} *</label>
                  <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
                    {/* Calendar header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-black/6 dark:border-white/8 bg-gradient-to-r from-[#FFAA00]/[0.04] to-transparent">
                      <button type="button" onClick={prevMonth} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/8 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-[#232323]/60 dark:text-white/60" />
                      </button>
                      <span className="text-sm font-semibold text-[#232323] dark:text-white">{MONTHS[calMonth]} {calYear}</span>
                      <button type="button" onClick={nextMonth} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/8 transition-colors">
                        <ChevronRight className="h-4 w-4 text-[#232323]/60 dark:text-white/60" />
                      </button>
                    </div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                      {DAYS.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-[#232323]/35 dark:text-white/30">{d}</div>
                      ))}
                    </div>
                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-1 px-3 pb-3">
                      {calDays.map((d, i) => {
                        if (!d) return <div key={`e-${i}`} />;
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const isSelected = form.scheduleDate === dateStr;
                        const isToday = dateStr === todayStr;
                        return (
                          <button key={i} type="button" onClick={() => selectDay(d)}
                            className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-[#FFAA00] text-[#232323] font-bold shadow-sm shadow-[#FFAA00]/30"
                                : isToday
                                  ? "ring-1 ring-[#FFAA00]/40 text-[#FFAA00] font-semibold hover:bg-[#FFAA00]/10"
                                  : "text-[#232323]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/8"
                            }`}>
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[10px] text-[#232323]/40 dark:text-white/35 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> {formatDateLabel(form.scheduleDate)}
                  </p>
                </div>

                {/* Time + Timezone + Parallel Sessions */}
                <div className="space-y-5">
                  {/* Time Picker */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">{t("scheduling.time")} *</label>
                    <div className="flex items-center gap-3">
                      {/* Hour picker */}
                      <div className="relative flex-1">
                        <button type="button" onClick={() => { setHourOpen(!hourOpen); setMinOpen(false); }}
                          className={`w-full h-12 rounded-xl border bg-white dark:bg-white/[0.03] flex items-center justify-center gap-1 transition-all ${
                            hourOpen ? "border-[#FFAA00]/50 ring-2 ring-[#FFAA00]/20" : "border-black/8 dark:border-white/10 hover:border-[#FFAA00]/30"}`}>
                          <span className="text-2xl font-bold text-[#232323] dark:text-white">{form.scheduleTime.split(":")[0]}</span>
                          <span className="text-[9px] text-[#232323]/35 dark:text-white/30 font-semibold uppercase mt-1">h</span>
                        </button>
                        {hourOpen && (
                          <div className="absolute z-20 top-full mt-1.5 left-0 right-0 rounded-xl border border-black/10 dark:border-white/12 bg-white dark:bg-[#1a1835] shadow-xl max-h-48 overflow-y-auto scrollbar-thin">
                            <div className="p-1.5 grid grid-cols-4 gap-1">
                              {hours.map(h => (
                                <button key={h} type="button"
                                  onClick={() => { const mm = form.scheduleTime.split(":")[1]; setForm(f => ({ ...f, scheduleTime: `${h}:${mm}` })); setHourOpen(false); }}
                                  className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                                    form.scheduleTime.split(":")[0] === h
                                      ? "bg-[#FFAA00] text-[#232323] shadow-sm"
                                      : "text-[#232323]/70 dark:text-white/70 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00]"}`}>
                                  {h}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-2xl font-bold text-[#FFAA00]">:</span>

                      {/* Minute picker */}
                      <div className="relative flex-1">
                        <button type="button" onClick={() => { setMinOpen(!minOpen); setHourOpen(false); }}
                          className={`w-full h-12 rounded-xl border bg-white dark:bg-white/[0.03] flex items-center justify-center gap-1 transition-all ${
                            minOpen ? "border-[#FFAA00]/50 ring-2 ring-[#FFAA00]/20" : "border-black/8 dark:border-white/10 hover:border-[#FFAA00]/30"}`}>
                          <span className="text-2xl font-bold text-[#232323] dark:text-white">{form.scheduleTime.split(":")[1]}</span>
                          <span className="text-[9px] text-[#232323]/35 dark:text-white/30 font-semibold uppercase mt-1">m</span>
                        </button>
                        {minOpen && (
                          <div className="absolute z-20 top-full mt-1.5 left-0 right-0 rounded-xl border border-black/10 dark:border-white/12 bg-white dark:bg-[#1a1835] shadow-xl overflow-hidden">
                            <div className="p-1.5 grid grid-cols-3 gap-1">
                              {minutes.map(m => (
                                <button key={m} type="button"
                                  onClick={() => { const hh = form.scheduleTime.split(":")[0]; setForm(f => ({ ...f, scheduleTime: `${hh}:${m}` })); setMinOpen(false); }}
                                  className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                                    form.scheduleTime.split(":")[1] === m
                                      ? "bg-[#FFAA00] text-[#232323] shadow-sm"
                                      : "text-[#232323]/70 dark:text-white/70 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00]"}`}>
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timezone buttons */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50 flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> {t("scheduling.timezone")}
                    </label>
                    <div className="flex items-center gap-2">
                      {TIMEZONES.map(tz => (
                        <button key={tz.value} type="button"
                          onClick={() => setForm(f => ({ ...f, timezone: tz.value }))}
                          className={`flex-1 h-10 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            form.timezone === tz.value
                              ? "bg-[#FFAA00]/15 text-[#FFAA00] ring-1 ring-[#FFAA00]/30 shadow-sm"
                              : "border border-black/8 dark:border-white/10 text-[#232323]/60 dark:text-white/60 hover:border-[#FFAA00]/30 hover:bg-[#FFAA00]/5"
                          }`}>
                          <span>{tz.flag}</span> {tz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parallel Sessions */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#232323]/50 dark:text-white/50">{t("scheduling.parallelSessions")}</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <button key={n} type="button"
                          onClick={() => setForm(f => ({ ...f, parallelSessions: n }))}
                          className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${
                            form.parallelSessions === n
                              ? "bg-[#FFAA00]/15 text-[#FFAA00] ring-1 ring-[#FFAA00]/30 shadow-sm"
                              : "border border-black/8 dark:border-white/10 text-[#232323]/60 dark:text-white/60 hover:border-[#FFAA00]/30 hover:bg-[#FFAA00]/5"
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#232323]/40 dark:text-white/35">{t("scheduling.maxParallel")}</p>
                  </div>
                </div>
              </div>

              {/* Schedule preview */}
              {form.scheduleDate && form.scheduleTime && (
                <div className="rounded-lg border border-[#FFAA00]/15 bg-[#FFAA00]/5 dark:bg-[#FFAA00]/[0.03] px-4 py-3 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#FFAA00] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-[#232323] dark:text-white">{formatDateLabel(form.scheduleDate)} at {form.scheduleTime}</span>
                    <span className="text-[#232323]/50 dark:text-white/50 ml-2">({TIMEZONES.find(t => t.value === form.timezone)?.label || form.timezone})</span>
                    {form.parallelSessions > 1 && (
                      <span className="text-[#232323]/50 dark:text-white/50 ml-2">\u00b7 {form.parallelSessions} parallel sessions</span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/6 dark:border-white/8">
                <button type="button" onClick={resetForm}
                  className="h-9 px-5 rounded-lg border border-black/10 dark:border-white/12 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">{t("scheduling.cancel")}</button>
                <button type="button" onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.scheduleDate || !form.scheduleTime || !form.testPlanId}
                  className="h-9 px-5 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold shadow-sm shadow-[#FFAA00]/20 disabled:opacity-50 inline-flex items-center gap-2 transition-all">
                  <Check className="h-3.5 w-3.5" /> {editId ? t("scheduling.update") : t("scheduling.create")}
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
              <p className="text-xs text-[#232323]/40 dark:text-white/40 font-medium">{t("scheduling.loading")}</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && schedules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#FFAA00]/10 flex items-center justify-center mb-5">
              <Calendar className="h-7 w-7 text-[#FFAA00]/60" />
            </div>
            <p className="text-lg font-bold text-[#232323] dark:text-white">{t("scheduling.noSchedules")}</p>
            <p className="text-sm text-[#232323]/50 dark:text-white/50 mt-1.5 max-w-sm">
              {t("scheduling.noSchedulesDesc")}
            </p>
            <button type="button" onClick={() => { resetForm(); setShowCreate(true); }}
              className="mt-5 h-9 px-5 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-all">
              <Plus className="h-3.5 w-3.5" /> {t("scheduling.createFirst")}
            </button>
          </div>
        )}

        {/* Schedule List */}
        {!loading && schedules.length > 0 && (
          <div className="space-y-3">
            {schedules.map((s) => {
              const planObj = s.testPlan;
              return (
                <div key={s.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  s.enabled
                    ? "border-black/6 dark:border-white/8 bg-white/80 dark:bg-[#13112a]/80 hover:border-[#FFAA00]/20 hover:shadow-md"
                    : "border-black/6 dark:border-white/6 bg-black/[0.01] dark:bg-white/[0.01] opacity-70"
                }`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Toggle + Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <button type="button" onClick={() => handleToggle(s)}
                          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border-2 transition-all ${
                            s.enabled
                              ? "border-emerald-400 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              : "border-black/10 dark:border-white/10 text-[#232323]/30 dark:text-white/30 hover:border-[#FFAA00]/30 hover:text-[#FFAA00]/50"
                          }`} title={s.enabled ? "Pause schedule" : "Enable schedule"}>
                          {s.enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#232323] dark:text-white text-sm">{s.name}</p>
                            {s.enabled ? (
                              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
                            ) : (
                              <span className="text-[10px] font-bold bg-black/5 dark:bg-white/10 text-[#232323]/40 dark:text-white/40 px-2 py-0.5 rounded-full">Paused</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#232323]/50 dark:text-white/50">
                            {planObj && (
                              <span className="inline-flex items-center gap-1">
                                <Layers className="h-3 w-3 text-[#FFAA00]" />
                                <span className="font-medium text-[#232323]/70 dark:text-white/70">{planObj.name}</span>
                                {planObj.environment && <span className="text-[#232323]/35 dark:text-white/30">({planObj.environment})</span>}
                              </span>
                            )}
                            <span className="text-[#232323]/20 dark:text-white/15">|</span>
                            <span className="font-medium">{s.cron}</span>
                            <span className="text-[#232323]/35 dark:text-white/30">{TIMEZONES.find(t => t.value === (s.timezone || "Europe/Paris"))?.label || s.timezone || "Europe/Paris"}</span>
                            {s.parallelSessions > 1 && (
                              <>
                                <span className="text-[#232323]/20 dark:text-white/15">|</span>
                                <span className="inline-flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-violet-500" />
                                  {s.parallelSessions} parallel
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Next run + actions */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right space-y-1 hidden sm:block">
                          <div className="flex items-center gap-1.5 text-xs text-[#232323]/55 dark:text-white/55 justify-end">
                            <Clock className="h-3 w-3 text-[#FFAA00]" />
                            <span className="font-medium">Next: {formatNextRun(s.nextRunAt)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#232323]/40 dark:text-white/35 justify-end">
                            <span>Last: {formatLastRun(s.lastRunAt)}</span>
                            <span className="inline-flex items-center gap-1"><RotateCw className="h-2.5 w-2.5" /> {s.runCount ?? 0} runs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => startEdit(s)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-[#232323]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/8 transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deleteConfirm === s.id ? (
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => handleDelete(s.id)}
                                className="h-7 px-2.5 rounded-lg bg-red-500 text-white text-[11px] font-bold">Delete</button>
                              <button type="button" onClick={() => setDeleteConfirm(null)}
                                className="h-7 px-2.5 rounded-lg border border-black/10 dark:border-white/12 text-[11px] font-medium">No</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setDeleteConfirm(s.id)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}