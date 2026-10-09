import React, { ReactNode } from 'react';
import { DatasetProvider } from '../context/DatasetContext';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <div className="dark">
      <DatasetProvider>
        {children}
      </DatasetProvider>
    </div>
  );
};
