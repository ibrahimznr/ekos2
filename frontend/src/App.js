import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
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

// Public Pages
import PublicRaporView from '@/pages/PublicRaporView';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
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
            {/* Çekiliş Routes */}
            <Route
              path="/cekilis"
              element={
                <ProtectedRoute>
                  <DrawsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cekilis/olustur"
              element={
                <ProtectedRoute>
                  <CreateDrawPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cekilis/:drawId"
              element={
                <ProtectedRoute>
                  <DrawDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cekilis/:drawId/sonuclar"
              element={
                <ProtectedRoute>
                  <DrawResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kelime-havuzu"
              element={
                <ProtectedRoute>
                  <VocabularyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/zeka-oyunu"
              element={
                <ProtectedRoute>
                  <MindReaderGame />
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