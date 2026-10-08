import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B111E] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0B111E]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
