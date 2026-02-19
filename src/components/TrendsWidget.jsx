import React, { useEffect, useState } from "react";
import { fetchTrends } from "../services/api";

export default function TrendsWidget() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrends()
      .then(data => {
        setTrends(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="mb-8">Loading trends...</div>;
  if (error) return <div className="mb-8 text-red-600">Error: {error}</div>;

  // Example rendering, adjust as needed for your API response
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8 animate-fade-in-up">
      <h3 className="text-lg font-bold mb-4 text-blue-900">Trends & Analytics</h3>
      <div className="flex flex-col gap-4">
        {trends && trends.map((trend, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="font-medium text-gray-700">{trend.label}</div>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${trend.value}%` }}></div>
            </div>
            <div className="text-xs text-gray-500">{trend.value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
