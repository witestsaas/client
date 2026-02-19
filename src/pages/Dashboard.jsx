import DashboardLayout from "../components/DashboardLayout";
import DashboardStats from "../components/DashboardStats";
import TrendsWidget from "../components/TrendsWidget";
import ActivityFeed from "../components/ActivityFeed";
import { useParams } from "react-router-dom";

export default function DashboardPage() {
  const { orgSlug } = useParams();
  return (
    <DashboardLayout>
      <DashboardStats />
      <TrendsWidget />
      <ActivityFeed />
      <h1 className="text-2xl font-bold mb-4 text-blue-900">Welcome to the Dashboard{orgSlug ? ` for ${orgSlug}` : ''}</h1>
      <p className="text-gray-700">Select a section from the sidebar to get started.</p>
    </DashboardLayout>
  );
}
