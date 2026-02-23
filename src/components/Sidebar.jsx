import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  UserCircle2,
  Settings,
  Sun,
} from "lucide-react";
import { NAV_SECTIONS } from "./dashboardNav";
import { useTheme } from "../utils/theme-context";
import { useAuth } from "../auth/AuthProvider.jsx";
import { fetchOrganization, fetchUserOrganizations } from "../services/organizations";

function getInitials(user) {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  const fallback = user?.email?.[0] || "U";
  return (first + last || fallback).toUpperCase();
}

export default function Sidebar({ collapsed, onToggle }) {
  const { orgSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [role, setRole] = useState("Viewer");
  const [organizations, setOrganizations] = useState([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!orgSlug || orgSlug === "no-org") return;
    fetchOrganization(orgSlug)
      .then((org) => setRole(org.currentUserRole || "Viewer"))
      .catch(() => setRole("Viewer"));
  }, [orgSlug]);

  useEffect(() => {
    fetchUserOrganizations()
      .then((data) => setOrganizations(Array.isArray(data?.organizations) ? data.organizations : []))
      .catch(() => setOrganizations([]));
  }, [orgSlug]);

  useEffect(() => {
    setSwitcherOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

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
    () => organizations.find((org) => org.slug === orgSlug) || null,
    [organizations, orgSlug],
  );

  const buildPath = (href) => `/dashboard/${orgSlug}${href ? `/${href}` : ""}`;

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
      setSwitcherOpen(false);
      return;
    }
    setSwitcherOpen(false);
    navigate(buildSwitchPath(targetOrgSlug));
  };

  return (
    <aside
      className={`h-screen bg-[#232323] dark:bg-black text-[#F6F6F6] border-r border-white/10 shadow-sm transition-all duration-300 flex flex-col ${
        collapsed ? "w-16" : "w-[260px]"
      }`}
    >
      <div className="flex items-center px-3 py-4 border-b border-white/10">
        <span className="flex items-center justify-center h-9 w-9 rounded-full bg-[#232323] border border-[#FFAA00]/60 shadow-sm">
          <img src="/image.png" alt="Logo" className="h-7 w-7 object-contain" />
        </span>
        {!collapsed && (
          <span
            className="ml-3 text-lg font-bold tracking-wide text-white select-none"
            style={{
              fontFamily: '"Quantico", "Exo 2", Futura, "Avenir Next", Avenir, "Helvetica Neue", Helvetica, Arial, sans-serif',
              letterSpacing: "0.05em",
            }}
          >
            QUALION
          </span>
        )}
      </div>

      {!collapsed ? (
        <div className="px-2 py-3 border-b border-white/10">
          <p className="px-1 mb-2 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Organization
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSwitcherOpen((open) => !open)}
              className="w-full inline-flex items-center justify-between rounded-lg border border-white/10 bg-white/5 text-white text-sm px-3 py-2 hover:bg-white/10"
            >
              <span className="truncate">{currentOrg?.name || orgSlug || "Select organization"}</span>
              <ChevronDown className="h-4 w-4 text-white/70" />
            </button>
            {switcherOpen ? (
              <div className="absolute left-0 right-0 mt-2 z-20 rounded-lg border border-white/10 bg-[#232323] dark:bg-black shadow-2xl p-1 max-h-56 overflow-y-auto">
                {organizations.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-white/60">No organizations</p>
                ) : (
                  organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSwitchOrganization(org.slug)}
                      className={`w-full text-left rounded-md px-2 py-2 text-sm transition-colors ${
                        org.slug === orgSlug
                          ? "bg-[#FFAA00] text-[#232323]"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <p className="truncate font-medium">{org.name}</p>
                      <p className={`truncate text-xs ${org.slug === orgSlug ? "text-[#232323]/80" : "text-white/50"}`}>
                        {org.role}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx}>
            {!collapsed && section.title && (
              <p className="px-3 mb-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            {section.items
              .filter((item) => {
                if (!section.title && item.label === "Dashboard") return true;
                if (item.section) return allowedSections.includes(item.section);
                return true;
              })
              .map((item) => (
                <Link
                  key={`${section.title || "main"}-${item.label}`}
                  to={buildPath(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={`group w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? "bg-[#FFAA00] text-[#232323] border-l-4 border-[#FFAA00] shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${isActive(item.href) ? "text-[#232323]" : "group-hover:text-[#FFAA00]"}`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              ))}
          </div>
        ))}
      </nav>

      <div className="px-2 pb-2 space-y-2">
        {(role === "Owner" || role === "Admin") && (
          <Link
            to={`/dashboard/${orgSlug}/settings`}
            className="w-full flex items-center gap-2 rounded-lg text-white hover:bg-white/10 font-semibold transition-colors px-3 py-2"
          >
            <Settings className="h-5 w-5 text-[#FFAA00]" />
            {!collapsed && <span>Settings</span>}
          </Link>
        )}

        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 rounded-lg text-white hover:bg-white/10 font-semibold transition-colors px-3 py-2"
          type="button"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-[#FFAA00]" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-[#FFAA00]" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <div className="px-2 py-3 flex justify-center">
        <button
          onClick={toggleTheme}
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#232323] border border-white/15 text-white hover:bg-[#FFAA00] hover:text-[#232323] font-semibold shadow-md transition-colors duration-200 py-2"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {!collapsed && <span>{theme === "light" ? "Dark" : "Light"} Mode</span>}
        </button>
      </div>

      <div className="border-t border-white/10 px-2 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => !collapsed && setProfileMenuOpen((open) => !open)}
            className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/10 ${collapsed ? "justify-center" : ""}`}
          >
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
              {getInitials(user)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </p>
                <p className="text-xs text-white/60 truncate">{user?.email || "-"}</p>
              </div>
            )}
            {!collapsed && <ChevronDown className="h-4 w-4 text-white/70" />}
          </button>

          {!collapsed && profileMenuOpen ? (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-white/10 bg-[#232323] dark:bg-black shadow-2xl p-1 z-20">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate(`/dashboard/${orgSlug}/profile`);
                }}
                className="w-full text-left rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center gap-2"
              >
                <UserCircle2 className="h-4 w-4 text-[#FFAA00]" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white inline-flex items-center gap-2"
              >
                <LogOut className="h-4 w-4 text-[#FFAA00]" />
                Logout
              </button>
            </div>
          ) : null}

        </div>
      </div>
    </aside>
  );
}
