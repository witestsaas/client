import React from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function ExecutionRuns() {
  return (
    <DashboardLayout>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-2xl font-bold text-[#232323] dark:text-white">Test Runs</h2>
        <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-2">
          Test runs view aligned with sidebar navigation.
        </p>
      </div>
    </DashboardLayout>
  );
}

