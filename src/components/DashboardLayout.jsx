
import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F6F6F6] dark:bg-black">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto bg-[#F6F6F6] dark:bg-black">{children}</main>
      </div>
    </div>
  );
}
