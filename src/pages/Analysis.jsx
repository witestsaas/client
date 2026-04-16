import React from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Activity, Bot, Rocket, Sparkles } from "lucide-react";

export default function Analysis() {
  const location = useLocation();
  const isCoverage = location.pathname.includes("/coverage");
  const title = isCoverage ? "Coverage" : "Insights";
  const Icon = isCoverage ? Activity : Bot;
  const description = isCoverage
    ? "Visualize test coverage gaps, track which features are tested, and ensure every critical path is covered."
    : "AI-powered analysis of test results, failure patterns, and actionable recommendations to improve quality.";

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center min-h-[70vh] p-4 lg:p-6">
        <div className="relative w-full max-w-lg text-center px-6">
          {/* Animated glow ring */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-[#FFAA00]/5 animate-ping" style={{ animationDuration: "3s" }} />
          </div>
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-[#FFAA00]/10 animate-pulse" style={{ animationDuration: "2s" }} />
          </div>

          {/* Icon */}
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FFAA00]/20 to-[#FFAA00]/5 border border-[#FFAA00]/20 flex items-center justify-center shadow-lg shadow-[#FFAA00]/10">
            <Icon className="h-10 w-10 text-[#FFAA00]" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-[#232323] dark:text-white mb-2">
            {title}
          </h2>

          {/* Coming Soon badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFAA00]/30 bg-[#FFAA00]/10 text-[#FFAA00] text-sm font-semibold mb-5">
            <Rocket className="h-4 w-4" />
            Coming Soon
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          </div>

          {/* Description */}
          <p className="text-[#232323]/60 dark:text-white/60 text-base leading-relaxed max-w-md mx-auto mb-8">
            {description}
          </p>

          {/* Feature pills */}
          {/*<div className="flex flex-wrap justify-center gap-2">
            {(isCoverage
              ? ["Feature mapping", "Gap detection", "Trend analysis", "Risk scoring"]
              : ["Failure patterns", "Smart recommendations", "Trend detection", "Root cause analysis"]
            ).map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-white/[0.06] text-[#232323]/70 dark:text-white/60 border border-black/5 dark:border-white/10"
              >
                {feature}
              </span>
            ))}
          </div>*/}
        </div>
      </div>
    </DashboardLayout>
  );
}
