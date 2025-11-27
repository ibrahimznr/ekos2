import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { FileText, CheckCircle2, XCircle, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projeler, setProjeler] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchProjeler();
  }, []);

  const fetchStats = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => fetchStats(retryCount + 1), 1000);
      } else {
        toast.error('İstatistikler yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjeler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/projeler`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjeler(response.data);
    } catch (error) {
      console.error('Projeler yüklenemedi');
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

  const uygunlukYuzdesi = stats?.total_raporlar > 0
    ? Math.round((stats.uygun_count / stats.total_raporlar) * 100)
    : 0;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Ekipman muayene raporlarınızın genel görünümü</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Reports */}
          <Card className="card-hover border-l-4 border-l-blue-600 shadow-md" data-testid="total-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Rapor</CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{stats?.total_raporlar || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Sistemdeki tüm raporlar</p>
            </CardContent>
          </Card>

          {/* Monthly Reports */}
          <Card className="card-hover border-l-4 border-l-purple-600 shadow-md" data-testid="monthly-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bu Ay</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{stats?.monthly_raporlar || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Oluşturulan rapor sayısı</p>
            </CardContent>
          </Card>

          {/* Uygun Reports */}
          <Card className="card-hover border-l-4 border-l-green-600 shadow-md" data-testid="approved-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Uygun</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{stats?.uygun_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1">%{uygunlukYuzdesi} uygunluk oranı</p>
            </CardContent>
          </Card>

          {/* Uygun Değil Reports */}
          <Card className="card-hover border-l-4 border-l-red-600 shadow-md" data-testid="rejected-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Uygun Değil</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{stats?.uygun_degil_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Dikkat gerekiyor</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiring Reports */}
          <Card className="shadow-md" data-testid="expiring-reports-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Geçerlilik Uyarıları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-gray-800">30 Gün İçinde</p>
                    <p className="text-sm text-gray-600">Geçerliliği bitecek raporlar</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-700">{stats?.expiring_30_days || 0}</div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-800">7 Gün İçinde</p>
                    <p className="text-sm text-gray-600">Acil dikkat gerekiyor</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">{stats?.expiring_7_days || 0}</div>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="shadow-md" data-testid="category-distribution-card">
            <CardHeader>
              <CardTitle className="text-lg">Kategori Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.kategori_dagilim && stats.kategori_dagilim.length > 0 ? (
                <div className="space-y-3">
                  {stats.kategori_dagilim.map((item, index) => {
                    const percentage = stats.total_raporlar > 0
                      ? Math.round((item.count / stats.total_raporlar) * 100)
                      : 0;
                    
                    const colors = [
                      'bg-blue-600',
                      'bg-purple-600',
                      'bg-green-600',
                      'bg-amber-600',
                      'bg-red-600',
                      'bg-indigo-600',
                    ];
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{item.kategori}</span>
                          <span className="text-gray-600">{item.count} (%{percentage})</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Henüz rapor bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/raporlar')}
                className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-sm"
                data-testid="view-all-reports-button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tüm Raporları Görüntüle
              </Button>
              <Button
                onClick={() => navigate('/raporlar?filter=expiring')}
                variant="outline"
                className="border-amber-600 text-amber-700 hover:bg-amber-50"
                data-testid="expiring-reports-button"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Süresi Dolanlar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;