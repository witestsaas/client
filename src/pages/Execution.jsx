import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { BarChart3, ClipboardList, Layers, PlayCircle } from "lucide-react";

export default function Execution() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-[#232323] dark:text-white">Execution</h2>
          <p className="text-[#232323]/70 dark:text-white/70">Manage test cases, plans, runs, and reports.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Test Cases", desc: "Create and organize reusable tests", icon: ClipboardList },
            { title: "Test Plans", desc: "Compose suites and scenarios", icon: Layers },
            { title: "Test Runs", desc: "Execute and monitor runs", icon: PlayCircle },
            { title: "Reports", desc: "Analyze pass/fail outcomes", icon: BarChart3 },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-4 hover:border-[#FFAA00]/60 transition-all">
              <item.icon className="h-5 w-5 text-[#FFAA00] mb-2" />
              <h3 className="font-semibold text-[#232323] dark:text-white">{item.title}</h3>
              <p className="text-sm text-[#232323]/60 dark:text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
