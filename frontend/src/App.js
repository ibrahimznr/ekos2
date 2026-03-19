import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import '@/i18n';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Raporlar from '@/pages/Raporlar';
import ProjeRaporlar from '@/pages/ProjeRaporlar';
import IskeleBilesenleri from '@/pages/IskeleBilesenleri';
import AdminPanel from '@/pages/AdminPanel';
import Ayarlar from '@/pages/Ayarlar';
import Makineler from '@/pages/Makineler';
import CepheIskeleleri from '@/pages/CepheIskeleleri';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';

// Çekiliş Pages
import DrawsListPage from '@/pages/cekilis/DrawsListPage';
import CreateDrawPage from '@/pages/cekilis/CreateDrawPage';
import DrawDetailPage from '@/pages/cekilis/DrawDetailPage';
import DrawResultsPage from '@/pages/cekilis/DrawResultsPage';
import VocabularyPage from '@/pages/cekilis/VocabularyPage';
import MindReaderGame from '@/pages/cekilis/MindReaderGame';

// Kombinasyonlar Pages
import SansTopuTahmin from '@/pages/SansTopuTahmin';

// Metraj
import MetrajCetveli from '@/pages/MetrajCetveli';

// Public Pages
import PublicRaporView from '@/pages/PublicRaporView';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin-only route protection
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const DashboardRoute = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Viewer'lar için raporlar sayfasına yönlendir
  if (user.role === 'viewer') {
    return <Navigate to="/raporlar" replace />;
  }

  // Admin ve Inspector için Dashboard
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/rapor/:raporId" element={<PublicRaporView />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<DashboardRoute />} />
            <Route
              path="/raporlar"
              element={
                <ProtectedRoute>
                  <Raporlar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projeler/:projeId/raporlar"
              element={
                <ProtectedRoute>
                  <ProjeRaporlar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/iskele-bilesenleri"
              element={
                <ProtectedRoute>
                  <IskeleBilesenleri />
                </ProtectedRoute>
              }
            />
            <Route
              path="/makineler"
              element={
                <ProtectedRoute>
                  <Makineler />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cephe-iskeleleri"
              element={
                <ProtectedRoute>
                  <CepheIskeleleri />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ayarlar"
              element={
                <ProtectedRoute>
                  <Ayarlar />
                </ProtectedRoute>
              }
            />
            {/* Çekiliş Routes - Admin Only */}
            <Route
              path="/cekilis"
              element={
                <AdminRoute>
                  <DrawsListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/cekilis/olustur"
              element={
                <AdminRoute>
                  <CreateDrawPage />
                </AdminRoute>
              }
            />
            <Route
              path="/cekilis/:drawId"
              element={
                <AdminRoute>
                  <DrawDetailPage />
                </AdminRoute>
              }
            />
            <Route
              path="/cekilis/:drawId/sonuclar"
              element={
                <AdminRoute>
                  <DrawResultsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/kelime-havuzu"
              element={
                <AdminRoute>
                  <VocabularyPage />
                </AdminRoute>
              }
            />
            <Route
              path="/zeka-oyunu"
              element={
                <AdminRoute>
                  <MindReaderGame />
                </AdminRoute>
              }
            />
            {/* Kombinasyonlar Routes - Admin Only */}
            <Route
              path="/sans-topu-tahmin"
              element={
                <AdminRoute>
                  <SansTopuTahmin />
                </AdminRoute>
              }
            />
            {/* Metraj Route */}
            <Route
              path="/metraj"
              element={
                <ProtectedRoute>
                  <MetrajCetveli />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  );
}

export default App;