import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Activity, Bot, Shield } from "lucide-react";

export default function Analysis() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-[#232323] dark:text-white">Analysis</h2>
          <p className="text-[#232323]/70 dark:text-white/70">Explore insights and quality coverage.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Insights", desc: "AI-assisted findings and trends", icon: Bot },
            { title: "Coverage", desc: "Track execution coverage by scope", icon: Activity },
            { title: "Explorer", desc: "Investigate deep execution details", icon: Shield },
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
