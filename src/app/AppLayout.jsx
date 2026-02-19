// App layout wrapper
import React from 'react';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      {/* Add header, sidebar, etc. here */}
      {children}
    </div>
  );
}
