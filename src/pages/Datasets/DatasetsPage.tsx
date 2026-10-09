import React, { useState, useEffect } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { datasetApi } from '../../services/api/datasetApi';
import { DatasetListItem } from '../../types/dataset';
import { Modal } from '../../components/common/Modal';
import { 
  Database, 
  Plus, 
  FolderOpen, 
  HardDrive, 
  CheckCircle, 
  UploadCloud, 
  Search,
  Filter,
  CheckCircle2,
  Cpu,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Layers,
  Activity
} from 'lucide-react';

export const DatasetsPage: React.FC = () => {
  const { activeDataset, switchDataset, activeProfile } = useDataset();
  const [datasetsList, setDatasetsList] = useState<DatasetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [onboardPath, setOnboardPath] = useState('');
  const [onboardId, setOnboardId] = useState('');
  const [onboardName, setOnboardName] = useState('');
  const [onboardCategory, setOnboardCategory] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    datasetApi.listDatasets().then((res) => {
      if (isMounted && res && res.datasets) {
        setDatasetsList(res.datasets);
      }
    }).catch(err => console.warn('Failed to list datasets', err));
    return () => { isMounted = false; };
  }, [activeDataset]);

  const handleActivateDataset = async (datasetId: string) => {
    setIsLoading(true);
    setStatusMsg(`Activating ${datasetId} pipeline and AI engine...`);
    try {
      await switchDataset(datasetId);
      const res = await datasetApi.listDatasets();
      if (res && res.datasets) setDatasetsList(res.datasets);
      setStatusMsg(`Successfully activated ${datasetId}!`);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e: any) {
      setStatusMsg(`Activation error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardPath || !onboardId) return;
    setIsLoading(true);
    setStatusMsg(`Onboarding dataset from ${onboardPath}...`);
    try {
      await datasetApi.onboardDataset({
        path: onboardPath,
        product_id: onboardId,
        name: onboardName || onboardId,
        category: onboardCategory || 'General Industrial'
      });
      const res = await datasetApi.listDatasets();
      if (res && res.datasets) setDatasetsList(res.datasets);
      setIsModalOpen(false);
      setStatusMsg(`Dataset ${onboardId} successfully onboarded into framework!`);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (e: any) {
      setStatusMsg(`Onboarding error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = datasetsList.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.category.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">DATASET MANAGEMENT</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Dataset & Framework Registry</h1>
              <p className="text-xs text-slate-400">
                Switch active product categories and onboard automated visual inspection datasets
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-blue"
        >
          <Plus className="w-4 h-4" />
          Onboard New Dataset
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-950/60 border border-blue-500/40 rounded-xl text-xs text-cyan-300 font-medium flex items-center gap-2 animate-fade-in shadow-md">
          <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Registered Datasets</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{datasetsList.length}</div>
          </div>
          <FolderOpen className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Active AI Model</span>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1 truncate max-w-[200px]">
              {activeProfile?.model_metrics?.engine_name || (activeDataset === 'water_bottle' ? 'PatchCore ResNet18' : 'YOLO11n-PCB')}
            </div>
          </div>
          <Zap className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Hardware Accelerator</span>
            <div className="text-sm font-bold font-mono text-purple-400 mt-1">
              RTX 2050 CUDA (4GB VRAM)
            </div>
          </div>
          <Cpu className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => {
          const isActive = item.id === activeDataset;
          return (
            <div 
              key={item.id}
              className={`p-5 rounded-xl border transition flex flex-col justify-between ${
                isActive 
                  ? 'bg-industrial-900/90 border-cyan-500 shadow-glow-cyan' 
                  : 'bg-industrial-950/70 border-industrial-border hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{item.name}</h3>
                  </div>
                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      ACTIVE PRODUCT
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      STANDBY
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-4">{item.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 text-xs font-mono">
                  <div className="bg-industrial-950 p-2.5 rounded-lg border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">AI ENGINE</span>
                    <span className="text-slate-200 font-semibold truncate block mt-0.5">
                      {item.engine_type === 'patch_anomaly' ? 'PatchCore Anomaly' : 'Supervised YOLO11'}
                    </span>
                  </div>
                  <div className="bg-industrial-950 p-2.5 rounded-lg border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">DEFECT CLASSES</span>
                    <span className="text-cyan-400 font-bold block mt-0.5">
                      {item.defect_classes_count} Types
                    </span>
                  </div>
                  <div className="bg-industrial-950 p-2.5 rounded-lg border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">ACCURACY / ROC</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">
                      {item.accuracy ? `${item.accuracy.toFixed(1)}%` : '100% AUROC'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-industrial-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">ID: {item.id}</span>
                {isActive ? (
                  <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Driving UI & Vision Pipeline
                  </span>
                ) : (
                  <button
                    onClick={() => handleActivateDataset(item.id)}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-glow-blue disabled:opacity-50"
                  >
                    <span>Activate Dataset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboard Dataset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Product Dataset"
        subtitle="Register a new vision dataset into the generalized inspection framework"
      >
        <form onSubmit={handleOnboardSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Dataset Directory Path</label>
            <input
              type="text"
              required
              value={onboardPath}
              onChange={(e) => setOnboardPath(e.target.value)}
              placeholder="e.g. D:\Projects\SEC\datasets\water_bottle"
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Directory containing train/good or labeled defect folders</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Product Unique ID</label>
            <input
              type="text"
              required
              value={onboardId}
              onChange={(e) => setOnboardId(e.target.value)}
              placeholder="e.g. medical_vial or turbine_blade"
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Display Product Name</label>
            <input
              type="text"
              value={onboardName}
              onChange={(e) => setOnboardName(e.target.value)}
              placeholder="e.g. Sterile Medical Glass Vial"
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
            <input
              type="text"
              value={onboardCategory}
              onChange={(e) => setOnboardCategory(e.target.value)}
              placeholder="e.g. Pharmaceutical Packaging"
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
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
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-glow-blue disabled:opacity-50"
            >
              Onboard & Build AI Engine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
