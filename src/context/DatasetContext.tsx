import React, { createContext, useContext, useState, useEffect } from 'react';
import { datasetApi } from '../services/api/datasetApi';
import { ProductProfile, DatasetListItem } from '../types/dataset';

interface DatasetContextType {
  activeDataset: string;
  datasets: DatasetListItem[];
  profile: ProductProfile | null;
  activeProfile: ProductProfile | null;
  isSwitching: boolean;
  switchDataset: (datasetId: string) => Promise<void>;
  refreshDatasets: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial default dataset is always 'water_bottle'
  const [activeDataset, setActiveDataset] = useState<string>(() => {
    return localStorage.getItem('active_dataset_id') || 'water_bottle';
  });
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [profile, setProfile] = useState<ProductProfile | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  const loadActiveProfile = async () => {
    try {
      const p = await datasetApi.getActiveProfile();
      setProfile(p);
      if (p.product_id) {
        setActiveDataset(p.product_id);
        localStorage.setItem('active_dataset_id', p.product_id);
      }
    } catch (e) {
      console.warn('Failed to load active profile', e);
    }
  };

  const refreshDatasets = async () => {
    try {
      const data = await datasetApi.listDatasets();
      setDatasets(data.datasets);
      if (data.active_dataset && data.active_dataset !== activeDataset) {
        setActiveDataset(data.active_dataset);
      }
    } catch (e) {
      console.warn('Failed to refresh datasets', e);
    }
  };

  useEffect(() => {
    refreshDatasets();
    loadActiveProfile();
  }, []);

  const switchDataset = async (datasetId: string) => {
    if (datasetId === activeDataset && profile) return;
    setIsSwitching(true);
    try {
      const res = await datasetApi.selectDataset(datasetId);
      if (res.success && res.profile) {
        setActiveDataset(res.active_dataset);
        setProfile(res.profile);
        localStorage.setItem('active_dataset_id', res.active_dataset);
        // Refresh dataset list active flag
        await refreshDatasets();
      }
    } catch (e) {
      console.error('Failed to switch dataset', e);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        activeDataset,
        datasets,
        profile,
        activeProfile: profile,
        isSwitching,
        switchDataset,
        refreshDatasets
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = (): DatasetContextType => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};
