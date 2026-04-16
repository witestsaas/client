import {
  Activity,
  BarChart3,
  Bot,
  Calendar,
  ClipboardList,
  Globe,
  Layers,
  Play,
  Users,
  Zap,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    items: [{ label: "Dashboard", i18nKey: "nav.dashboard", icon: BarChart3, href: "", section: "dashboard" }],
  },
  {
    title: "Testing",
    i18nTitle: "nav.testing",
    items: [
      { label: "Test Cases", i18nKey: "nav.testCases", icon: ClipboardList, href: "execution/tests", section: "execution" },
      { label: "Test Plans", i18nKey: "nav.testPlans", icon: Layers, href: "execution/plans", section: "execution" },
      { label: "Test Runs", i18nKey: "nav.testRuns", icon: Play, href: "execution/runs", section: "execution" },
      //{ label: "API Tests", i18nKey: "nav.apiTests", icon: Globe, href: "execution/api-tests", section: "execution" },
      //{ label: "Reports", i18nKey: "nav.reports", icon: BarChart3, href: "execution/results", section: "execution" },
      //{ label: "Scheduling", i18nKey: "nav.scheduling", icon: Calendar, href: "execution/scheduling", section: "execution" },
    ],
  },
  {
    title: "Analysis",
    i18nTitle: "nav.analysis",
    items: [
      { label: "Insights", i18nKey: "nav.insights", icon: Bot, href: "analysis/insights", section: "analysis" },
      { label: "Coverage", i18nKey: "nav.coverage", icon: Activity, href: "analysis/coverage", section: "analysis" },
      //{ label: "Performance", i18nKey: "nav.performance", icon: Zap, href: "analysis/performance", section: "analysis" },
    ],
  },
  {
    title: "Platform",
    i18nTitle: "nav.platform",
    items: [
      { label: "Organizations", i18nKey: "nav.organizations", icon: Users, href: "platform/organizations", section: "platform" },
    ],
  },
];
