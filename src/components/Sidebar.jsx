import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  Monitor,
  Moon,
  MoveHorizontal,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  Search,
  Settings,
  Sun,
  UserCircle2,
  UserPlus,
} from "lucide-react";
import { NAV_SECTIONS } from "./dashboardNav";
import { useTheme } from "../utils/theme-context";
import { useLanguage } from "../utils/language-context";
import { useAuth } from "../auth/AuthProvider.jsx";
import { createOrganization, fetchOrganization, fetchUserOrganizations, joinOrganizationByCode } from "../services/organizations";
import logo from "../assets/logo_yellow.svg";


function getInitials(user) {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  const fallback = user?.email?.[0] || "U";
  return (first + last || fallback).toUpperCase();
}

function getOrgInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Sidebar({ collapsed, onToggle }) {
  const { orgSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, mode, setMode, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const [role, setRole] = useState(() => {
    try { return localStorage.getItem(`org_role_${orgSlug}`) || "Viewer"; } catch { return "Viewer"; }
  });
  const [organizations, setOrganizations] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_orgs");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherSearch, setSwitcherSearch] = useState("");
  const [switcherView, setSwitcherView] = useState("list"); // "list" | "create" | "join"
  const [newOrgName, setNewOrgName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [switcherError, setSwitcherError] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const profileRef = useRef(null);
  const switcherRef = useRef(null);

  useEffect(() => {
    if (!orgSlug || orgSlug === "no-org") return;
    fetchOrganization(orgSlug)
      .then((org) => {
        const r = org.currentUserRole || "Viewer";
        setRole(r);
        try { localStorage.setItem(`org_role_${orgSlug}`, r); } catch {}
      })
      .catch(() => setRole("Viewer"));
  }, [orgSlug]);

  useEffect(() => {
    fetchUserOrganizations()
      .then((data) => {
        const list = Array.isArray(data?.organizations) ? data.organizations : [];
        setOrganizations(list);
        try { localStorage.setItem("cached_orgs", JSON.stringify(list)); } catch {}
      })
      .catch(() => setOrganizations([]));
  }, [orgSlug]);

  // Close menus on route change
  {/*
  useEffect(() => {
  setSwitcherOpen(false);
  setProfileMenuOpen(false);
  }, [location.pathname]);
    */}
  useEffect(() => {
    closeSwitcher();
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const closeSwitcher = () => {
    setSwitcherOpen(false);
    setSwitcherSearch("");
    setSwitcherView("list");
    setNewOrgName("");
    setJoinCode("");
    setSwitcherError("");
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setSwitcherLoading(true);
    setSwitcherError("");
    try {
      const org = await createOrganization(newOrgName.trim());
      const data = await fetchUserOrganizations();
      const list = Array.isArray(data?.organizations) ? data.organizations : [];
      setOrganizations(list);
      try { localStorage.setItem("cached_orgs", JSON.stringify(list)); } catch {}
      closeSwitcher();
      navigate(`/dashboard/${org.id}`);
    } catch (err) {
      setSwitcherError(err.message || "Failed to create organization");
    } finally {
      setSwitcherLoading(false);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setSwitcherLoading(true);
    setSwitcherError("");
    try {
      const data = await joinOrganizationByCode(joinCode.trim());
      const refreshed = await fetchUserOrganizations();
      const list = Array.isArray(refreshed?.organizations) ? refreshed.organizations : [];
      setOrganizations(list);
      try { localStorage.setItem("cached_orgs", JSON.stringify(list)); } catch {}
      closeSwitcher();
      navigate(`/dashboard/${data.orgId || data.orgSlug}`);
    } catch (err) {
      setSwitcherError(err.message || "Failed to join organization");
    } finally {
      setSwitcherLoading(false);
    }
  };

  // Click-outside handlers
  useEffect(() => {
    if (!profileMenuOpen && !switcherOpen) return;
    function onClickOutside(e) {
      if (profileMenuOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (switcherOpen && switcherRef.current && !switcherRef.current.contains(e.target)) {
        closeSwitcher();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen, switcherOpen]);

  const allowedSections = useMemo(() => {
    const map = {
      Owner: ["dashboard", "execution", "analysis", "platform"],
      Admin: ["dashboard", "execution", "analysis", "platform"],
      Tester: ["dashboard", "execution", "platform"],
      Viewer: ["dashboard", "platform"],
    };
    return map[role] || map.Viewer;
  }, [role]);

  const currentOrg = useMemo(
    () => organizations.find((org) => org.id === orgSlug || org.slug === orgSlug) || null,
    [organizations, orgSlug],
  );

  const buildPath = (href) => `/dashboard/${orgSlug}${href ? `/${href}` : ""}`;

  const buildNavPath = (href, label) => {
    if (label === "Test Cases" && orgSlug && typeof window !== "undefined") {
      const selectedProjectId = window.localStorage.getItem(`selectedProject_${orgSlug}`) || "";
      if (selectedProjectId) {
        return `/dashboard/${orgSlug}/execution/tests/${selectedProjectId}`;
      }
    }
    return buildPath(href);
  };

  const buildSwitchPath = (targetOrgSlug) => {
    const parts = location.pathname.split("/").filter(Boolean);
    const suffix = parts.slice(2).join("/");
    return `/dashboard/${targetOrgSlug}${suffix ? `/${suffix}` : ""}`;
  };

  const isActive = (href) => {
    const path = buildPath(href);
    if (!href) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleSwitchOrganization = (targetOrgSlug) => {
    if (!targetOrgSlug || targetOrgSlug === orgSlug) {
      closeSwitcher();
      return;
    }
    closeSwitcher();
    navigate(buildSwitchPath(targetOrgSlug));
  };

  /* ── Profile dropdown item ── */
  const DropItem = ({ icon: Icon, label, onClick, danger }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md px-3 py-2 text-[13px] inline-flex items-center gap-2.5 transition-colors cursor-pointer ${
        danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      {label}
    </button>
  );

  /* ── Profile dropdown with sub-menus ── */
  const DropSection = ({ children }) => (
    <div className="py-1">{children}</div>
  );

  return (
    <aside
      className={`relative overflow-visible h-[100dvh] bg-[#1c1a2e] dark:bg-[#1c1a2e] text-[#F6F6F6] border-r border-white/10 shadow-sm flex flex-col ${
        collapsed ? "w-16" : "w-[260px]"
      }`}
      style={{ transition: "width 200ms ease" }}
    >
      {/* ═══════════ Logo + Collapse ═══════════ */}
      <div className={`h-13 shrink-0 flex items-center relative ${collapsed ? "justify-center px-2" : "justify-between px-3"}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg">
            <img src={logo} alt="Qalion" className="h-5 w-5 object-contain" />
          </div>
          {!collapsed && <span className="text-base font-bold tracking-tight text-white select-none">QALION</span>}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="group absolute right-0 top-2.5 translate-x-1/2 h-8 w-6 rounded-none inline-flex items-center justify-center transition-all duration-200 cursor-pointer z-50 opacity-90 hover:opacity-100"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5 text-[#A7A0A1] transition-all duration-200 group-hover:text-[#FFD166] group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,186,59,0.95)] " />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          className="group absolute right-0 top-2.5 translate-x-1/2 h-8 w-6 rounded-none inline-flex items-center justify-center transition-all duration-200 cursor-pointer z-50 opacity-90 hover:opacity-100"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <PanelRightClose className="h-3.5 w-3.5 text-[#A7A0A1] transition-all duration-200 group-hover:text-[#FFD166] group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,186,59,0.95)]" />
        </button>
      )}

      {/* ═══════════ Organization Switcher ═══════════ */}
      <div className="px-2 pt-0.5 pb-0.5 shrink-0" ref={switcherRef}>
        {!collapsed && (
          <p className="px-1 mb-0.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            {t("profile.organization")}
          </p>
        )}
        <div className="relative">
          <button
            type="button"
            //onClick={() => setSwitcherOpen((open) => !open)}
            onClick={() => switcherOpen ? closeSwitcher() : setSwitcherOpen(true)}
            className={`w-full flex items-center rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer ${
              collapsed ? "justify-center h-10 w-full" : "justify-between px-2.5 py-2 gap-2"
            }`}
            title={collapsed ? (currentOrg?.name || orgSlug || "Select organization") : undefined}
          >
            <div className="h-7 w-7 shrink-0 rounded-md bg-[#FFAA00]/15 text-[#FFAA00] text-[11px] font-bold inline-flex items-center justify-center">
              {getOrgInitials(currentOrg?.name || orgSlug)}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-white truncate">{currentOrg?.name || orgSlug || "Select org"}</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform shrink-0 ${switcherOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          {switcherOpen && (
            <div
              className={`absolute z-30 rounded-xl border border-white/10 bg-[#252340] shadow-2xl overflow-hidden ${
                collapsed ? "left-full ml-2 top-0 w-64" : "left-0 right-0 mt-1.5"
              }`}
            >
              {switcherView === "list" && (
                <>
                  {/* Search */}
                  <div className="px-2 pt-2 pb-1">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        value={switcherSearch}
                        onChange={(e) => setSwitcherSearch(e.target.value)}
                        placeholder={t("profile.searchOrgs")}
                        autoFocus
                        className="w-full h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] pl-8 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFAA00]/40 focus:ring-1 focus:ring-[#FFAA00]/20"
                      />
                    </div>
                  </div>

                  {/* Org list */}
                  <div className="px-1 py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {(() => {
                      const term = switcherSearch.trim().toLowerCase();
                      const filtered = term
                        ? organizations.filter((org) => org.name?.toLowerCase().includes(term))
                        : organizations;
                      if (filtered.length === 0) {
                        return (
                          <p className="px-3 py-3 text-xs text-white/40 text-center">
                            {organizations.length === 0 ? t("profile.noOrgs") : t("profile.noMatch")}
                          </p>
                        );
                      }
                      return filtered.map((org) => {
                        const active = org.id === orgSlug || org.slug === orgSlug;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => handleSwitchOrganization(org.id)}
                            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer ${
                              active
                                ? "bg-[#FFAA00]/10 text-[#FFAA00]"
                                : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            <div className={`h-7 w-7 shrink-0 rounded-md text-[10px] font-bold inline-flex items-center justify-center ${active ? "bg-[#FFAA00]/20 text-[#FFAA00]" : "bg-white/10 text-white/70"}`}>
                              {getOrgInitials(org.name)}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="truncate font-medium text-[13px]">{org.name}</p>
                              <p className={`truncate text-[11px] ${active ? "text-[#FFAA00]/60" : "text-white/40"}`}>
                                {org.role}
                              </p>
                            </div>
                            {active && <Check className="h-3.5 w-3.5 text-[#FFAA00] shrink-0" />}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Divider */}
                  <div className="mx-2 border-t border-white/[0.08]" />

                  {/* Create / Join actions */}
                  <div className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => { setSwitcherView("create"); setSwitcherError(""); }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="h-7 w-7 shrink-0 rounded-md bg-emerald-500/15 text-emerald-400 inline-flex items-center justify-center">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{t("profile.createOrg")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSwitcherView("join"); setSwitcherError(""); }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="h-7 w-7 shrink-0 rounded-md bg-blue-500/15 text-blue-400 inline-flex items-center justify-center">
                        <UserPlus className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{t("profile.joinOrg")}</span>
                    </button>
                  </div>
                </>
              )}

              {switcherView === "create" && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <button type="button" onClick={() => { setSwitcherView("list"); setSwitcherError(""); }} className="h-6 w-6 rounded-md hover:bg-white/10 inline-flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer">
                      <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    <p className="text-[13px] font-semibold text-white">{t("profile.createOrg")}</p>
                  </div>
                  <form onSubmit={handleCreateOrg} className="space-y-2.5">
                    <input
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder={t("profile.orgName")}
                      autoFocus
                      required
                      className="w-full h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFAA00]/40 focus:ring-1 focus:ring-[#FFAA00]/20"
                    />
                    {switcherError && <p className="text-xs text-red-400">{switcherError}</p>}
                    <button
                      type="submit"
                      disabled={switcherLoading || !newOrgName.trim()}
                      className="w-full h-9 rounded-lg bg-[#FFAA00] text-[#232323] text-sm font-semibold hover:bg-[#FFAA00]/90 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {switcherLoading ? t("profile.creating") : t("profile.createOrg")}
                    </button>
                  </form>
                </div>
              )}

              {switcherView === "join" && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <button type="button" onClick={() => { setSwitcherView("list"); setSwitcherError(""); }} className="h-6 w-6 rounded-md hover:bg-white/10 inline-flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer">
                      <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    <p className="text-[13px] font-semibold text-white">{t("profile.joinOrg")}</p>
                  </div>
                  <form onSubmit={handleJoinOrg} className="space-y-2.5">
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder={t("profile.inviteCode")}
                      autoFocus
                      required
                      className="w-full h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFAA00]/40 focus:ring-1 focus:ring-[#FFAA00]/20"
                    />
                    {switcherError && <p className="text-xs text-red-400">{switcherError}</p>}
                    <button
                      type="submit"
                      disabled={switcherLoading || !joinCode.trim()}
                      className="w-full h-9 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/15 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {switcherLoading ? t("profile.joining") : t("profile.joinOrg")}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ Navigation ═══════════ */}
      <nav className="flex-1 min-h-0 px-2 pt-1 pb-2 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx}>
            {!collapsed && section.title && (
              <p className="px-3 mb-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                {section.i18nTitle ? t(section.i18nTitle) : section.title}
              </p>
            )}
            {section.items
              .filter((item) => {
                if (!section.title && item.label === "Dashboard") return true;
                if (item.section) return allowedSections.includes(item.section);
                return true;
              })
              .map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={`${section.title || "main"}-${item.label}`}
                    to={buildNavPath(item.href, item.label)}
                    title={collapsed ? (item.i18nKey ? t(item.i18nKey) : item.label) : undefined}
                    className={`group w-full flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[#FFAA00] text-[#232323] shadow-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <item.icon
                      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#232323]" : "group-hover:text-[#FFAA00]"}`}
                    />
                    {!collapsed && <span className="truncate">{item.i18nKey ? t(item.i18nKey) : item.label}</span>}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* ═══════════ Profile Area ═══════════ */}
      <div className="border-t border-white/10 px-2 py-2 shrink-0" ref={profileRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            className={`ui-dropdown-trigger w-full flex items-center rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors cursor-pointer ${collapsed ? "justify-center" : "gap-3"}`}
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#FFAA00]/60 to-[#FFAA00]/20 ring-2 ring-white/10 flex items-center justify-center text-xs font-semibold overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" />
              ) : (
                <span className="text-white">{getInitials(user)}</span>
              )}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="text-[11px] text-white/50 truncate">{user?.email || "-"}</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-white/40 shrink-0 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          {profileMenuOpen ? (
            <div
              className={`ui-dropdown-panel absolute z-40 rounded-xl border border-white/10 bg-[#252340] shadow-2xl ${
                collapsed
                  ? "bottom-0 left-full ml-2 w-60"
                  : "bottom-full left-0 right-0 mb-2"
              }`}
            >
              {/* Header */}
              <div className="px-3.5 py-3 border-b border-white/[0.08] flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#FFAA00]/60 to-[#FFAA00]/20 flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white">{getInitials(user)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">
                    {user?.firstName || "User"} {user?.lastName || ""}
                  </p>
                  <p className="text-[11px] text-white/45 truncate">{user?.email || "-"}</p>
                </div>
              </div>

              {/* Section 1: Account */}
              <DropSection>
                <DropItem icon={UserCircle2} label={t("profile.account")} onClick={() => { setProfileMenuOpen(false); navigate(`/dashboard/${orgSlug}/profile`); }} />
                {(role === "Owner" || role === "Admin") && (
                  <DropItem icon={Settings} label={t("profile.settings")} onClick={() => { setProfileMenuOpen(false); navigate(`/dashboard/${orgSlug}/settings?tab=api-keys`); }} />
                )}
              </DropSection>

              <div className="mx-3 border-t border-white/[0.08]" />

              {/* Section 2: Org */}
              <DropSection>
                <DropItem icon={Building2} label={t("profile.organizations")} onClick={() => { setProfileMenuOpen(false); navigate(`/dashboard/${orgSlug}/platform/organizations`); }} />
                <DropItem icon={CreditCard} label={t("profile.usageCredits")} onClick={() => { setProfileMenuOpen(false); navigate(`/dashboard/${orgSlug}/settings?tab=credits`); }} />
              </DropSection>

              <div className="mx-3 border-t border-white/[0.08]" />

              {/* Section 3: Preferences */}
              <DropSection>
                {/* Appearance — right-side flyout */}
                <div
                  className="relative"
                  onMouseEnter={() => { setAppearanceOpen(true); setLanguageOpen(false); }}
                  onMouseLeave={() => setAppearanceOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => { setAppearanceOpen((v) => !v); setLanguageOpen(false); }}
                    className="ui-dropdown-item w-full text-left rounded-md px-3 py-2 text-[13px] text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      {theme === "light" ? <Sun className="h-4 w-4 opacity-70" /> : <Moon className="h-4 w-4 opacity-70" />}
                      {t("profile.appearance")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[11px] text-white/40 capitalize">
                        {mode === "system" ? t("appearance.system") : mode === "dark" ? t("appearance.dark") : t("appearance.light")}
                      </span>
                      <ChevronRight className={`h-3 w-3 text-white/30 transition-transform ${appearanceOpen ? "rotate-90" : ""}`} />
                    </span>
                  </button>
                  {appearanceOpen && (
                    <div className="ui-dropdown-panel absolute left-full top-0 ml-2 w-44 rounded-xl border border-white/10 bg-[#252340] shadow-2xl p-1 z-50">
                      {[
                        { key: "light", label: t("appearance.light"), icon: Sun },
                        { key: "dark", label: t("appearance.dark"), icon: Moon },
                        { key: "system", label: t("appearance.system"), icon: Monitor },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setMode(key); setAppearanceOpen(false); }}
                          className={`ui-dropdown-item w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                            mode === key ? "text-[#FFAA00] bg-[#FFAA00]/10" : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4 opacity-70" />
                          <span className="flex-1">{label}</span>
                          {mode === key && <Check className="h-3.5 w-3.5 text-[#FFAA00]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Language — right-side flyout */}
                <div
                  className="relative"
                  onMouseEnter={() => { setLanguageOpen(true); setAppearanceOpen(false); }}
                  onMouseLeave={() => setLanguageOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => { setLanguageOpen((v) => !v); setAppearanceOpen(false); }}
                    className="ui-dropdown-item w-full text-left rounded-md px-3 py-2 text-[13px] text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Globe className="h-4 w-4 opacity-70" />
                      {t("profile.language")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[11px] text-white/40 uppercase">{lang}</span>
                      <ChevronRight className={`h-3 w-3 text-white/30 transition-transform ${languageOpen ? "rotate-90" : ""}`} />
                    </span>
                  </button>
                  {languageOpen && (
                    <div className="ui-dropdown-panel absolute left-full top-0 ml-2 w-44 rounded-xl border border-white/10 bg-[#252340] shadow-2xl p-1 z-50">
                      {[
                        { key: "en", label: "English", flag: "🇬🇧" },
                        { key: "fr", label: "Français", flag: "🇫🇷" },
                        { key: "es", label: "Español", flag: "🇪🇸" },
                      ].map(({ key, label, flag }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setLang(key); setLanguageOpen(false); }}
                          className={`ui-dropdown-item w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                            lang === key ? "text-[#FFAA00] bg-[#FFAA00]/10" : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="text-base">{flag}</span>
                          <span className="flex-1">{label}</span>
                          {lang === key && <Check className="h-3.5 w-3.5 text-[#FFAA00]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <DropItem icon={HelpCircle} label={t("profile.help")} onClick={() => { setProfileMenuOpen(false); window.open("http://localhost:3000/?openAssistant=true", "_blank", "noopener"); }} />
              </DropSection>

              <div className="mx-3 border-t border-white/[0.08]" />

              {/* Section 4: Sign out */}
              <DropSection>
                <DropItem icon={LogOut} label={t("profile.signOut")} danger onClick={() => { setProfileMenuOpen(false); navigate("/logout", { replace: true }); }} />
              </DropSection>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
