import React, { useState, useEffect } from "react";
import { fetchStats } from "../services/api";

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="mb-8">Loading stats...</div>;
  if (error) return <div className="mb-8 text-red-600">Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center animate-fade-in-up">
        <div className="text-3xl font-bold text-blue-700 mb-2">{stats.projects}</div>
        <div className="text-sm text-gray-500">Projects</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center animate-fade-in-up">
        <div className="text-3xl font-bold text-green-600 mb-2">{stats.testCases}</div>
        <div className="text-sm text-gray-500">Test Cases</div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center animate-fade-in-up">
        <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.successRate}%</div>
        <div className="text-sm text-gray-500">Success Rate</div>
      </div>
    </div>
  );
}
