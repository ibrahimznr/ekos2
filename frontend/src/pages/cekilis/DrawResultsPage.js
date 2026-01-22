import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DrawResultsPage = () => {
  const { drawId } = useParams();
  const navigate = useNavigate();
  const [draw, setDraw] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadResults();
  }, [drawId]);

  const loadResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [drawRes, resultsRes] = await Promise.all([
        axios.get(`${API}/draws/${drawId}`, { headers }),
        axios.get(`${API}/draws/${drawId}/results`, { headers })
      ]);
      setDraw(drawRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      console.error('Sonuçlar yüklenemedi:', error);
      toast.error('Sonuçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/draws/${drawId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cekilis_${draw.name}_sonuclar.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel dosyası indirildi!');
    } catch (error) {
      console.error('Export hatası:', error);
      toast.error('Excel dosyası oluşturulamadı');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </Layout>
    );
  }

  if (!results) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Sonuç bulunamadı</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/cekilis')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Çekilişlere Dön
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800" data-testid="results-title">
              {draw.name} - Sonuçlar
            </h1>
            <p className="text-gray-600 mt-1">
              Çekiliş Tarihi: {new Date(results.draw_date).toLocaleString('tr-TR')}
            </p>
          </div>
          
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            data-testid="export-results-button"
          >
            <Download className="w-5 h-5 mr-2" />
            {exporting ? 'İndiriliyor...' : 'Excel İndir'}
          </Button>
        </div>

        {/* Winners */}
        <Card className="shadow-lg border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-3 text-green-800">
              <Trophy className="w-8 h-8 text-green-600" />
              Asıl Talihliler
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.winners.map((winner, index) => (
                <div
                  key={winner.id}
                  className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6"
                  data-testid={`winner-${index}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl">
                      {index + 1}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-semibold">KAZANAN</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-gray-800">
                      {winner.first_name} {winner.last_name}
                    </div>
                    <div className="text-sm text-gray-600">ID: {winner.id_no}</div>
                    <div className="text-sm text-gray-500">{winner.contact}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backups */}
        {results.backups.length > 0 && (
          <Card className="shadow-lg border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center gap-3 text-amber-800">
                <Trophy className="w-8 h-8 text-amber-600" />
                Yedek Talihliler
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.backups.map((backup, index) => (
                  <div
                    key={backup.id}
                    className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6"
                    data-testid={`backup-${index}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl">
                        {index + 1}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-amber-600 font-semibold">YEDEK</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-gray-800">
                        {backup.first_name} {backup.last_name}
                      </div>
                      <div className="text-sm text-gray-600">ID: {backup.id_no}</div>
                      <div className="text-sm text-gray-500">{backup.contact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DrawResultsPage;
