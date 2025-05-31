import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Layout components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CapaList = React.lazy(() => import('./pages/capa/CapaList'));
const CapaDetail = React.lazy(() => import('./pages/capa/CapaDetail'));
const CapaCreate = React.lazy(() => import('./pages/capa/CapaCreate'));
const CapaEdit = React.lazy(() => import('./pages/capa/CapaEdit'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="Sayfa yükleniyor..." />
  </div>
);

function App() {
  return (
    <>
      <Helmet>
        <title>KYS - Kalite Yönetim Sistemi</title>
        <meta name="description" content="ISO 9001 standardına uygun kapsamlı kalite yönetim sistemi" />
      </Helmet>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />

          {/* Main application routes */}
          <Route path="/" element={<Layout />}>
            {/* Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* CAPA routes */}
            <Route path="capa">
              <Route index element={<CapaList />} />
              <Route path="new" element={<CapaCreate />} />
              <Route path=":id" element={<CapaDetail />} />
              <Route path=":id/edit" element={<CapaEdit />} />
            </Route>

            {/* Future modules will be added here */}
            {/* 
            <Route path="documents">
              <Route index element={<DocumentList />} />
              <Route path=":id" element={<DocumentDetail />} />
            </Route>
            
            <Route path="audit">
              <Route index element={<AuditList />} />
              <Route path=":id" element={<AuditDetail />} />
            </Route>
            
            <Route path="risk">
              <Route index element={<RiskList />} />
              <Route path=":id" element={<RiskDetail />} />
            </Route>
            */}
          </Route>

          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;