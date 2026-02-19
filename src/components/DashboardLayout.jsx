
import React, { useState } from "react";
import UserContextBar from "./UserContextBar";
import DashboardHeader from "./DashboardHeader";


import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#F6F6F6]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <DashboardHeader />
        <UserContextBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
