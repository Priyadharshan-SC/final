import React, { useState } from 'react';
import { mockEdgeDevice } from '../../services/mock/mockData';
import { 
  Settings as SettingsIcon, 
  Camera, 
  Cpu, 
  Sliders, 
  Bell, 
  Globe, 
  Save, 
  CheckCircle2, 
  HardDrive, 
  Wifi,
  Thermometer
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'factory' | 'camera' | 'device' | 'api' | 'notifications'>('camera');
  const [cameraFps, setCameraFps] = useState(60);
  const [cameraExposure, setCameraExposure] = useState(12.5);
  const [conveyorSpeed, setConveyorSpeed] = useState(0.4);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">SETTINGS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">System & Hardware Configuration</h1>
              <p className="text-xs text-slate-400">Configure cameras, optical triggers, edge devices, and API gateways</p>
            </div>
          </div>
        </div>

        {savedMessage && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved successfully!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-industrial-border pb-2 overflow-x-auto">
        {[
          { id: 'camera', label: 'Camera & Optics', icon: Camera },
          { id: 'factory', label: 'Factory & Conveyor', icon: Sliders },
          { id: 'device', label: 'Edge Device Telemetry', icon: Cpu },
          { id: 'api', label: 'API & Gateway', icon: Globe },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-glow-blue'
                  : 'text-slate-400 hover:text-white hover:bg-industrial-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-6 shadow-card-dark space-y-6">
            <h3 className="text-sm font-semibold text-white">Sony IMX477 Industrial Sensor Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Sensor Resolution</label>
                <select className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                  <option value="1920x1080">1920 × 1080 (Full HD, 60 FPS)</option>
                  <option value="3840x2160">3840 × 2160 (4K UHD, 30 FPS)</option>
                  <option value="1280x720">1280 × 720 (High-Speed, 120 FPS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Trigger Mode</label>
                <select className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                  <option value="hardware">Hardware Optical Sensor Trigger</option>
                  <option value="continuous">Continuous Streaming</option>
                  <option value="software">Software Manual Trigger</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>Stream Frame Rate (FPS)</span>
                  <span className="font-mono text-cyan-400">{cameraFps} FPS</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  value={cameraFps}
                  onChange={(e) => setCameraFps(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>Sensor Exposure Time (ms)</span>
                  <span className="font-mono text-cyan-400">{cameraExposure} ms</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="0.5"
                  value={cameraExposure}
                  onChange={(e) => setCameraExposure(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Factory Tab */}
        {activeTab === 'factory' && (
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-6 shadow-card-dark space-y-6">
            <h3 className="text-sm font-semibold text-white">Line 01 Automation & Pneumatics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Factory Station Line</label>
                <input
                  type="text"
                  defaultValue="Factory Line - 01 (SMT Hall A)"
                  className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>Defect Decision Threshold</span>
                  <span className="font-mono text-cyan-400">{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Anomalies with confidence ≥ {confidenceThreshold}% are diverted to Defect Lane.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>Conveyor Belt Speed</span>
                  <span className="font-mono text-cyan-400">{conveyorSpeed} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={conveyorSpeed}
                  onChange={(e) => setConveyorSpeed(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Sorting Actuator Pulse (ms)</label>
                <input
                  type="number"
                  defaultValue={150}
                  className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Device Telemetry Tab */}
        {activeTab === 'device' && (
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-6 shadow-card-dark space-y-6">
            <h3 className="text-sm font-semibold text-white">NVIDIA Jetson AGX Orin Industrial Telemetry</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-industrial-950 p-4 rounded-xl border border-industrial-border">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span>CPU USAGE</span>
                  <Cpu className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-white">{mockEdgeDevice.cpuUsagePercent}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${mockEdgeDevice.cpuUsagePercent}%` }} />
                </div>
              </div>

              <div className="bg-industrial-950 p-4 rounded-xl border border-industrial-border">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span>GPU TENSOR</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-purple-400">{mockEdgeDevice.gpuUsagePercent}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${mockEdgeDevice.gpuUsagePercent}%` }} />
                </div>
              </div>

              <div className="bg-industrial-950 p-4 rounded-xl border border-industrial-border">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span>CORE TEMP</span>
                  <Thermometer className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-emerald-400">{mockEdgeDevice.temperatureC}°C</div>
                <span className="text-[10px] text-slate-500">Normal thermal range</span>
              </div>

              <div className="bg-industrial-950 p-4 rounded-xl border border-industrial-border">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span>STORAGE</span>
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">{mockEdgeDevice.storageUsagePercent}%</div>
                <span className="text-[10px] text-slate-500">382 GB Available</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-400 border-t border-industrial-border/60 pt-4">
              <div className="flex justify-between">
                <span>Device IP:</span>
                <span className="text-slate-200">{mockEdgeDevice.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>Firmware:</span>
                <span className="text-slate-200">JetPack 6.0 (L4T 36.3.0)</span>
              </div>
              <div className="flex justify-between">
                <span>Camera Interface:</span>
                <span className="text-emerald-400">MIPI CSI-2 (4-Lane Active)</span>
              </div>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-6 shadow-card-dark space-y-6">
            <h3 className="text-sm font-semibold text-white">Backend Endpoints & Environment Gateways</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">REST API Base URL (FastAPI)</label>
                <input
                  type="text"
                  defaultValue="http://localhost:8000/api"
                  className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">WebSocket Inspection Stream URL</label>
                <input
                  type="text"
                  defaultValue="ws://localhost:8000/ws"
                  className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-4 rounded-lg bg-industrial-950 border border-industrial-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Local Mock Mode (VITE_USE_MOCK_API)</h4>
                  <p className="text-[11px] text-slate-400">Allows running frontend independently with realistic industrial test cases.</p>
                </div>
                <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-6 shadow-card-dark space-y-4">
            <h3 className="text-sm font-semibold text-white">Alarm & Alert Thresholds</h3>
            <div className="space-y-3 text-xs">
              {[
                { title: 'Defect Spike Alarm', desc: 'Notify operator when defect rate exceeds 12% in 10 minutes.' },
                { title: 'Thermal Warning', desc: 'Alert when edge GPU temperature rises above 75°C.' },
                { title: 'Camera FPS Drop Warning', desc: 'Alert when frame rate drops below 45 FPS.' },
                { title: 'Conveyor Jam Detection', desc: 'Audible alarm if optical trigger does not cycle for 30s.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-industrial-950 border border-industrial-border">
                  <div>
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-[11px]">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-700 text-blue-600 cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-blue"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
