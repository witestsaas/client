import {
  Activity,
  BarChart3,
  Bot,
  ClipboardList,
  Layers,
  Play,
  Users,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    items: [{ label: "Dashboard", icon: BarChart3, href: "", section: "dashboard" }],
  },
  {
    title: "Testing",
    items: [
      { label: "Test Cases", icon: ClipboardList, href: "execution/tests", section: "execution" },
      { label: "Test Plans", icon: Layers, href: "execution/plans", section: "execution" },
      { label: "Test Runs", icon: Play, href: "execution/runs", section: "execution" },
      { label: "Reports", icon: BarChart3, href: "execution/results", section: "execution" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { label: "Insights", icon: Bot, href: "analysis/insights", section: "analysis" },
      { label: "Coverage", icon: Activity, href: "analysis/coverage", section: "analysis" },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Organizations", icon: Users, href: "platform/organizations", section: "platform" },
    ],
  },
];
