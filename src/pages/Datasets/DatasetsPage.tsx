import React, { useState } from 'react';
import { mockDatasets } from '../../services/mock/mockData';
import { DatasetInfo } from '../../types/system';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  Database, 
  Plus, 
  FolderOpen, 
  HardDrive, 
  CheckCircle, 
  UploadCloud, 
  Search,
  Filter
} from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>(mockDatasets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newBoardType, setNewBoardType] = useState('ESP32');
  const [search, setSearch] = useState('');

  const handleCreateDataset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDatasetName) return;

    const newDs: DatasetInfo = {
      id: `ds-${Date.now()}`,
      name: newDatasetName,
      boardType: newBoardType,
      totalImages: 0,
      goodSamples: 0,
      defectiveSamples: 0,
      version: 'v1.0',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'PROCESSING',
    };

    setDatasets([newDs, ...datasets]);
    setNewDatasetName('');
    setIsModalOpen(false);
  };

  const filtered = datasets.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.boardType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">DATASETS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Dataset Management</h1>
              <p className="text-xs text-slate-400">Manage PCB golden reference sets and defect training corpora</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-blue"
        >
          <Plus className="w-4 h-4" />
          Create New Dataset
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Datasets</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{datasets.length}</div>
          </div>
          <FolderOpen className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Labeled PCB Images</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">8,620</div>
          </div>
          <HardDrive className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Model-Ready Corpora</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">3 Active</div>
          </div>
          <CheckCircle className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-white">Registered Datasets</h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets..."
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-industrial-border/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Dataset Name</th>
                <th className="py-3 px-3">Board Target</th>
                <th className="py-3 px-3">Total Images</th>
                <th className="py-3 px-3">Good Samples</th>
                <th className="py-3 px-3">Defective Samples</th>
                <th className="py-3 px-3">Version</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/40 font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-industrial-800/40 transition">
                  <td className="py-3.5 px-3 font-semibold text-cyan-400 font-sans">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">{item.boardType}</td>
                  <td className="py-3.5 px-3 text-white font-bold">{item.totalImages.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-emerald-400">{item.goodSamples.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-rose-400">{item.defectiveSamples.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-slate-400">{item.version}</td>
                  <td className="py-3.5 px-3 text-slate-400 font-sans">{item.createdAt}</td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Dataset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New PCB Dataset"
        subtitle="Initialize a new training corpus for anomaly detection"
      >
        <form onSubmit={handleCreateDataset} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Dataset Name</label>
            <input
              type="text"
              required
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              placeholder="e.g. ESP32-S3 Extended High-Density"
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Board Architecture Target</label>
            <select
              value={newBoardType}
              onChange={(e) => setNewBoardType(e.target.value)}
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ESP32">ESP32 (Standard)</option>
              <option value="Arduino">Arduino Nano Every</option>
              <option value="Raspberry Pi Pico">Raspberry Pi Pico RP2040</option>
              <option value="Custom SMD">Custom Multi-Layer SMD</option>
            </select>
          </div>

          <div className="border border-dashed border-industrial-borderLight rounded-xl p-6 text-center bg-industrial-950/60">
            <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-semibold">Drop ZIP archive or image folder</p>
            <p className="text-[11px] text-slate-500 mt-1">Raw optical inspection images (JPG, PNG, TIFF)</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-industrial-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-industrial-950 text-slate-300 rounded-lg text-xs font-medium border border-industrial-border hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-glow-blue"
            >
              Initialize Dataset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
