import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, ShieldCheck, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DatasetSelector } from './DatasetSelector';

interface TopbarProps {
  onSearch?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [hasNotifs, setHasNotifs] = useState(true);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    } else if (searchValue.trim()) {
      navigate(`/history?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-[#080D1A] border-b border-industrial-border px-6 flex items-center justify-between gap-4 z-20">
      {/* Left: Dataset Selector */}
      <div className="flex items-center gap-3">
        <DatasetSelector />
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search items, inspections, defects..."
            className="w-full bg-[#0E1626] border border-industrial-border rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition font-sans"
          />
        </div>
      </form>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Connection Status Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-[#0E1626] border border-industrial-border px-3 py-1.5 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI: ONLINE</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Camera className="w-3.5 h-3.5" />
            <span>60 FPS</span>
          </div>
        </div>

        {/* Notifications */}
        <button
          onClick={() => setHasNotifs(false)}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="System Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasNotifs && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#080D1A]" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-6 w-px bg-industrial-border" />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-900/50">
            P
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-tight">Priyadharshan</div>
            <div className="text-[10px] text-slate-400 font-medium">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
