import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDataset } from '../../context/DatasetContext';
import { 
  LayoutDashboard, 
  Camera, 
  Layers, 
  History, 
  Database, 
  Cpu, 
  BarChart2, 
  Settings, 
  Scan
} from 'lucide-react';

interface SidebarProps {
  currentLine?: string;
  isOnline?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentLine = 'Production Line - 01', isOnline = true }) => {
  const { profile, activeDataset } = useDataset();
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Inspection', path: '/live-inspection', icon: Camera },
    { label: 'Batch Inspection', path: '/batch-inspection', icon: Layers },
    { label: 'Inspection History', path: '/history', icon: History },
    { label: 'Dataset Management', path: '/datasets', icon: Database },
    { label: 'Model Management', path: '/models', icon: Cpu },
    { label: 'Reports', path: '/reports', icon: BarChart2 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#080D1A] border-r border-industrial-border flex flex-col justify-between flex-shrink-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="px-5 py-5 border-b border-industrial-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                OptiInspect <span className="text-cyan-400 font-mono">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Adaptive Visual AOI</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/15 text-cyan-400 font-semibold border-l-2 border-l-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Dynamic Product Profile Widget Footer */}
      <div className="p-3 border-t border-industrial-border/60">
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-3 shadow-card-dark space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                {profile?.name || (activeDataset === 'water_bottle' ? 'Water Bottle' : 'PCB Industrial')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-[11px] font-medium text-emerald-400">{isOnline ? 'Active' : 'Offline'}</span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-industrial-border/40 pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Engine :</span>
              <span className="text-cyan-400 font-medium truncate max-w-[120px]">
                {profile?.engine_type === 'patch_anomaly' ? 'PatchCore Anomaly' : 'YOLO11n Supervised'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Device :</span>
              <span className="text-emerald-400 font-medium">RTX 2050 (CUDA)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status :</span>
              <span className="text-slate-300 font-medium">Production</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
