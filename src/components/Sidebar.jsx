import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { UserCircleIcon, Cog6ToothIcon, ChartBarIcon, PlayCircleIcon, HomeIcon } from "@heroicons/react/24/outline";

const navItems = [
  { name: "Overview", path: "", icon: HomeIcon },
  { name: "Profile", path: "profile", icon: UserCircleIcon },
  { name: "Settings", path: "settings", icon: Cog6ToothIcon },
  { name: "Platform", path: "platform", icon: ChartBarIcon },
  { name: "Execution", path: "execution", icon: PlayCircleIcon },
  { name: "Analysis", path: "analysis", icon: ChartBarIcon },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { orgSlug } = useParams();
  const location = useLocation();
  return (
    <aside className={`h-screen bg-[#232323] text-white border-r border-white/10 shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex flex-col`}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <span className="text-lg font-bold tracking-tight">{!collapsed && 'Dashboard'}</span>
        <button onClick={onToggle} className="text-white/60 hover:text-white p-1 ml-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-1 mt-4">
        {navItems.map(({ name, path, icon: Icon }) => {
          const to = `/dashboard/${orgSlug}${path ? `/${path}` : ''}`;
          const active = location.pathname === to;
          return (
            <Link
              key={name}
              to={to}
              className={`flex items-center gap-3 px-4 py-2 rounded transition-colors font-medium ${active ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-white/80'}`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
