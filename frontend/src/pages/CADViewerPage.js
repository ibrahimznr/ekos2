import React from 'react';
import Layout from '@/components/Layout';
import CADViewer from '@/components/CADViewer';
import { FileCode2 } from 'lucide-react';

const CADViewerPage = () => {
  return (
    <Layout>
      <div className="space-y-6" data-testid="cad-viewer-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
                <FileCode2 className="h-6 w-6 text-white" />
              </div>
              CAD Görüntüleyici
            </h1>
            <p className="text-gray-600 mt-1">
              DXF formatındaki teknik çizimleri görüntüleyin ve yönetin
            </p>
          </div>
        </div>

        {/* CAD Viewer Component */}
        <CADViewer 
          showUpload={true}
          className="min-h-[600px]"
        />

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 text-white">
            <h3 className="font-semibold text-cyan-400 mb-2">Desteklenen Öğeler</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Çizgiler (LINE)</li>
              <li>• Daireler (CIRCLE)</li>
              <li>• Yaylar (ARC)</li>
              <li>• Çoklu Çizgiler (POLYLINE)</li>
              <li>• Spline Eğrileri</li>
              <li>• Metinler (TEXT)</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 text-white">
            <h3 className="font-semibold text-cyan-400 mb-2">Kontroller</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• <kbd className="px-1 bg-slate-700 rounded">Mouse Wheel</kbd> - Yakınlaştır/Uzaklaştır</li>
              <li>• <kbd className="px-1 bg-slate-700 rounded">Sol Tık + Sürükle</kbd> - Kaydır</li>
              <li>• <kbd className="px-1 bg-slate-700 rounded">+/-</kbd> butonları - Zoom</li>
              <li>• Katman kontrolü ile görünürlük</li>
            </ul>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 text-white">
            <h3 className="font-semibold text-cyan-400 mb-2">Dosya Formatı</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• <strong>DXF</strong> formatı desteklenir</li>
              <li>• AutoCAD 2000-2024 uyumlu</li>
              <li>• DWG dosyalarını önce DXF'e dönüştürün</li>
              <li>• Maksimum dosya boyutu: 50MB</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CADViewerPage;
