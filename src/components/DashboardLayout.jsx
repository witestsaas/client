import React, { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import { usePresenceHeartbeat } from "../hooks/useOrganizationPresence.ts";

function readCollapsed() {
  try { return localStorage.getItem("sidebar_collapsed") === "1"; } catch { return false; }
}

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed);
  const { orgSlug } = useParams();

  usePresenceHeartbeat(orgSlug);

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  }, []);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#fafafa] dark:bg-[#13112a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleCollapsed} />
      <div
        className={`flex-1 min-w-0 flex flex-col h-[100dvh] overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <DashboardHeader />
        <main className="flex-1 min-h-0 flex flex-col bg-[#fafafa] dark:bg-[#13112a]">{children}</main>
      </div>
    </div>
  );
}
