
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import { usePresenceHeartbeat } from "../hooks/useOrganizationPresence.ts";

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { orgSlug } = useParams();

  usePresenceHeartbeat(orgSlug);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#fafafa] dark:bg-[#13112a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div
        className={`flex-1 min-w-0 flex flex-col h-[100dvh] overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <DashboardHeader />
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#fafafa] dark:bg-[#13112a] [scrollbar-gutter:stable] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
