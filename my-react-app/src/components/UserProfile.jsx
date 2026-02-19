import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfile = () => {
  const { user, isAuthenticated, logout } = useAuth0();

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded shadow">
      {user.picture && (
        <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full" />
      )}
      <div>
        <div className="font-semibold">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
      <button
        className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => logout({ returnTo: window.location.origin })}
      >
        Log out
      </button>
    </div>
  );
};

export default UserProfile;
