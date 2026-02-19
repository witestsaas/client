import React, { useEffect, useState } from "react";
import { fetchActivity } from "../services/api";

export default function ActivityFeed() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivity()
      .then(data => {
        setActivity(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="mb-8">Loading activity...</div>;
  if (error) return <div className="mb-8 text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8 animate-fade-in-up">
      <h3 className="text-lg font-bold mb-4 text-blue-900">Recent Activity</h3>
      <ul className="divide-y divide-gray-200">
        {activity.map(item => (
          <li key={item.id} className="py-3 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-900">
              {item.user.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <span className="font-medium text-gray-700">{item.user}</span>
              <span className="ml-2 text-gray-500">{item.action}</span>
            </div>
            <span className="text-xs text-gray-400">{item.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
