
import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F6F6F6] dark:bg-[#232323]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div
        className={`flex-1 min-w-0 flex flex-col h-[100dvh] overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <DashboardHeader />
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#F6F6F6] dark:bg-[#232323] [scrollbar-gutter:stable] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
