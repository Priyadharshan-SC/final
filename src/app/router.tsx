import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { LiveInspectionPage } from '../pages/LiveInspection/LiveInspectionPage';
import { BatchInspectionPage } from '../pages/BatchInspection/BatchInspectionPage';
import { InspectionHistoryPage } from '../pages/InspectionHistory/InspectionHistoryPage';
import { InspectionDetailsPage } from '../pages/InspectionDetails/InspectionDetailsPage';
import { DatasetsPage } from '../pages/Datasets/DatasetsPage';
import { ModelsPage } from '../pages/Models/ModelsPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'live-inspection',
        element: <LiveInspectionPage />,
      },
      {
        path: 'batch-inspection',
        element: <BatchInspectionPage />,
      },
      {
        path: 'history',
        element: <InspectionHistoryPage />,
      },
      {
        path: 'inspection/:id',
        element: <InspectionDetailsPage />,
      },
      {
        path: 'datasets',
        element: <DatasetsPage />,
      },
      {
        path: 'models',
        element: <ModelsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
