import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import RaporModal from '@/components/RaporModal';
import { FileText, CheckCircle2, XCircle, Calendar, TrendingUp, AlertTriangle, Plus, FolderKanban, ChevronDown, ChevronUp, Gauge, Filter, X, SlidersHorizontal, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [allRaporlar, setAllRaporlar] = useState([]);
  const [projeler, setProjeler] = useState([]);
  const [kalibrasyonCihazlari, setKalibrasyonCihazlari] = useState([]);
  const [showKalibrasyonPopup, setShowKalibrasyonPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRaporModal, setShowRaporModal] = useState(false);
  const [filteredRaporlar, setFilteredRaporlar] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [showAllBilesenler, setShowAllBilesenler] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProje, setSelectedProje] = useState('all');
  const [selectedIl, setSelectedIl] = useState('all');
  const [selectedFirma, setSelectedFirma] = useState('all');
  const [excelLoading, setExcelLoading] = useState(false);

  // Get unique cities and companies from reports
  const { uniqueIller, uniqueFirmalar } = useMemo(() => {
    const iller = new Set();
    const firmalar = new Set();
    
    allRaporlar.forEach(rapor => {
      if (rapor.sehir) iller.add(rapor.sehir);
      if (rapor.firma) firmalar.add(rapor.firma);
    });
    
    return {
      uniqueIller: Array.from(iller).sort(),
      uniqueFirmalar: Array.from(firmalar).sort()
    };
  }, [allRaporlar]);

  // Filter reports based on selected filters
  const filteredStats = useMemo(() => {
    if (!stats || !allRaporlar.length) return stats;
    
    // If no filters selected, return original stats
    if (selectedProje === 'all' && selectedIl === 'all' && selectedFirma === 'all') {
      return stats;
    }
    
    // Filter reports
    const filtered = allRaporlar.filter(rapor => {
      if (selectedProje !== 'all' && rapor.proje_id !== selectedProje) return false;
      if (selectedIl !== 'all' && rapor.sehir !== selectedIl) return false;
      if (selectedFirma !== 'all' && rapor.firma !== selectedFirma) return false;
      return true;
    });
    
    // Calculate filtered stats
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const uygunCount = filtered.filter(r => r.uygunluk === 'Uygun').length;
    const uygunDegilCount = filtered.filter(r => r.uygunluk === 'Uygun Değil').length;
    
    const monthlyCount = filtered.filter(r => {
      const createdAt = new Date(r.created_at);
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    }).length;
    
    const expiredCount = filtered.filter(r => {
      if (!r.gecerlilik_tarihi) return false;
      return new Date(r.gecerlilik_tarihi) < today;
    }).length;
    
    const expiring30Days = filtered.filter(r => {
      if (!r.gecerlilik_tarihi) return false;
      const expiryDate = new Date(r.gecerlilik_tarihi);
      return expiryDate >= today && expiryDate <= thirtyDaysLater;
    }).length;
    
    // Calculate category distribution
    const kategoriMap = {};
    filtered.forEach(r => {
      if (r.kategori) {
        kategoriMap[r.kategori] = (kategoriMap[r.kategori] || 0) + 1;
      }
    });
    
    const kategoriDagilim = Object.entries(kategoriMap)
      .map(([kategori, count]) => ({ kategori, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      ...stats,
      total_raporlar: filtered.length,
      monthly_raporlar: monthlyCount,
      uygun_count: uygunCount,
      uygun_degil_count: uygunDegilCount,
      expired_count: expiredCount,
      expiring_30_days: expiring30Days,
      kategori_dagilim: kategoriDagilim
    };
  }, [stats, allRaporlar, selectedProje, selectedIl, selectedFirma]);

  const hasActiveFilters = selectedProje !== 'all' || selectedIl !== 'all' || selectedFirma !== 'all';

  const clearFilters = () => {
    setSelectedProje('all');
    setSelectedIl('all');
    setSelectedFirma('all');
  };

  // Export filtered data to Excel
  const handleExportFilteredExcel = async () => {
    setExcelLoading(true);
    try {
      const response = await api.post('/excel/export-filtered', {
        proje_id: selectedProje,
        sehir: selectedIl,
        firma: selectedFirma
      }, {
        responseType: 'blob',
        timeout: 30000
      });
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `dashboard_raporlar_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${filteredStats?.total_raporlar || 0} rapor Excel'e aktarıldı`);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Filtrelere uyan rapor bulunamadı');
      } else {
        toast.error('Excel indirme başarısız');
      }
    } finally {
      setExcelLoading(false);
    }
  };

  useEffect(() => {
    // Check if user has access to dashboard
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin' && user.role !== 'inspector') {
      toast.error('Dashboard\'a erişim yetkiniz yok');
      navigate('/raporlar');
      return;
    }

    fetchStats();
    fetchKalibrasyonCihazlari();
    fetchProjeler();
    fetchAllRaporlar();
  }, [navigate]);

  const fetchAllRaporlar = async () => {
    try {
      const response = await api.get('/raporlar');
      setAllRaporlar(response.data);
    } catch (error) {
      console.error('Raporlar yüklenemedi');
    }
  };

  const fetchStats = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/dashboard/stats', {
        timeout: 10000, // 10 second timeout
      });
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Session handling is done by api interceptor
      } else if (error.response?.status === 403) {
        toast.error('Dashboard\'a erişim yetkiniz yok');
        navigate('/raporlar');
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
      const response = await api.get('/projeler');
      setProjeler(response.data);
    } catch (error) {
      console.error('Projeler yüklenemedi');
    }
  };

  const fetchKalibrasyonCihazlari = async () => {
    try {
      const response = await api.get('/kalibrasyon/cihazlar');
      setKalibrasyonCihazlari(response.data);
    } catch (error) {
      console.error('Kalibrasyon cihazları yüklenemedi');
    }
  };

  const fetchExpiredReports = async () => {
    try {
      const response = await api.get('/raporlar?arama=&kategori=&uygunluk=');

      const today = new Date();
      const expired = response.data.filter(r => {
        if (!r.gecerlilik_tarihi) return false;
        const expiryDate = new Date(r.gecerlilik_tarihi);
        return expiryDate < today;
      });

      setFilteredRaporlar(expired);
      setFilterType('expired');
      navigate('/raporlar', { state: { filteredReports: expired, filterType: 'Süresi Geçenler' } });
    } catch (error) {
      toast.error('Süresi geçen raporlar yüklenemedi');
    }
  };

  const fetchExpiringReports = async () => {
    try {
      const response = await api.get('/raporlar?arama=&kategori=&uygunluk=');

      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);

      const expiring = response.data.filter(r => {
        if (!r.gecerlilik_tarihi) return false;
        const expiryDate = new Date(r.gecerlilik_tarihi);
        return expiryDate >= today && expiryDate <= thirtyDaysLater;
      });

      setFilteredRaporlar(expiring);
      setFilterType('expiring');
      navigate('/raporlar', { state: { filteredReports: expiring, filterType: '30 Gün İçinde Süresi Dolacaklar' } });
    } catch (error) {
      toast.error('Yaklaşan raporlar yüklenemedi');
    }
  };

  const handleProjectClick = (projeId) => {
    navigate(`/projeler/${projeId}/raporlar`);
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Ekipman muayene raporlarınızın genel görünümü</p>
        </div>

        {/* Hızlı İşlemler */}
        <Card className="shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {t('dashboard.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <Button
                onClick={() => setShowRaporModal(true)}
                className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white w-full justify-start h-11"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('dashboard.newReport')}</span>
              </Button>
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50 w-full justify-start h-11"
              >
                <FolderKanban className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('projects.title')}</span>
              </Button>
              <Button
                onClick={() => navigate('/raporlar')}
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-50 w-full justify-start h-11 xs:col-span-2 lg:col-span-1"
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{t('dashboard.viewAllReports')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gelişmiş Filtreleme Paneli */}
        <Card className="shadow-md border border-gray-200">
          <CardHeader className="pb-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg transition-colors -mx-2 px-2"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-gray-800">Gelişmiş Filtreleme</span>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Proje Seç */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Proje Seç</label>
                  <Select value={selectedProje} onValueChange={setSelectedProje}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tüm Projeler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Projeler</SelectItem>
                      {projeler.map(proje => (
                        <SelectItem key={proje.id} value={proje.id}>
                          {proje.proje_adi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* İl Seç */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">İl Seç</label>
                  <Select value={selectedIl} onValueChange={setSelectedIl}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tüm İller" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm İller</SelectItem>
                      {uniqueIller.map(il => (
                        <SelectItem key={il} value={il}>
                          {il}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Firma Adı */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Firma Adı</label>
                  <Select value={selectedFirma} onValueChange={setSelectedFirma}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tüm Firmalar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Firmalar</SelectItem>
                      {uniqueFirmalar.map(firma => (
                        <SelectItem key={firma} value={firma}>
                          {firma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtreleri Temizle */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className={`w-full h-10 ${hasActiveFilters ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-400'}`}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Filtreleri Temizle
                  </Button>
                </div>
              </div>

              {/* Active Filter Summary */}
              {hasActiveFilters && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 text-sm text-indigo-700">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Aktif Filtreler:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProje !== 'all' && (
                        <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs">
                          Proje: {projeler.find(p => p.id === selectedProje)?.proje_adi}
                        </span>
                      )}
                      {selectedIl !== 'all' && (
                        <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs">
                          İl: {selectedIl}
                        </span>
                      )}
                      {selectedFirma !== 'all' && (
                        <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs">
                          Firma: {selectedFirma}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Stats Grid - 2 cols on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Total Reports */}
          <Card className="card-hover border-l-4 border-l-blue-600 shadow-md" data-testid="total-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.totalReports')}</CardTitle>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{filteredStats?.total_raporlar || 0}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                {hasActiveFilters ? 'Filtrelenmiş sonuç' : 'Sistemdeki tüm raporlar'}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Reports */}
          <Card className="card-hover border-l-4 border-l-purple-600 shadow-md" data-testid="monthly-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Bu Ay</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{filteredStats?.monthly_raporlar || 0}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Oluşturulan rapor</p>
            </CardContent>
          </Card>

          {/* Uygun Reports */}
          <Card className="card-hover border-l-4 border-l-green-600 shadow-md" data-testid="approved-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('reports.compliant')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{filteredStats?.uygun_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                %{filteredStats?.total_raporlar > 0 ? Math.round((filteredStats.uygun_count / filteredStats.total_raporlar) * 100) : 0} uygunluk
              </p>
            </CardContent>
          </Card>

          {/* Uygun Değil Reports */}
          <Card className="card-hover border-l-4 border-l-red-600 shadow-md" data-testid="rejected-reports-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('reports.nonCompliant')}</CardTitle>
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{filteredStats?.uygun_degil_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Dikkat gerekiyor</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Expiring Reports */}
          <Card className="shadow-md" data-testid="expiring-reports-card">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                Geçerlilik Uyarıları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Button
                onClick={fetchExpiringReports}
                variant="outline"
                className="w-full flex items-center justify-between p-3 sm:p-4 h-auto bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">30 Gün İçinde</p>
                    <p className="text-xs sm:text-sm text-gray-600 hidden xs:block">Geçerliliği bitecek</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-700">{stats?.expiring_30_days || 0}</div>
              </Button>

              <Button
                onClick={fetchExpiredReports}
                variant="outline"
                className="w-full flex items-center justify-between p-3 sm:p-4 h-auto bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Süresi Geçenler</p>
                    <p className="text-xs sm:text-sm text-gray-600 hidden xs:block">Acil yenileme</p>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-red-700">{stats?.expired_count || 0}</div>
              </Button>
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

        {/* İskele Bileşenleri İstatistikleri */}
        {stats?.iskele_stats && (
          <Card className="shadow-md border-l-4 border-l-teal-500" data-testid="iskele-stats-card">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                <span>İskele Bileşenleri</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/iskele-bilesenleri')}
                  className="text-teal-600 border-teal-600 hover:bg-teal-50 w-full xs:w-auto"
                >
                  Detaylı Görünüm
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Stats Grid - 2 cols on mobile */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-2 sm:p-4 rounded-lg border border-teal-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-teal-700 mt-1">{stats.iskele_stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-4 rounded-lg border border-green-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Uygun</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-green-700 mt-1">{stats.iskele_stats.uygun}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-2 sm:p-4 rounded-lg border border-red-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Uygun Değil</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-red-700 mt-1">{stats.iskele_stats.uygun_degil}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 sm:p-4 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Oran</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-700 mt-1">{stats.iskele_stats.uygunluk_orani}%</p>
                </div>
              </div>

              {/* Bileşen Dağılımı */}
              {stats.iskele_stats.bilesen_dagilim && stats.iskele_stats.bilesen_dagilim.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
                    Bileşen Dağılımı
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({stats.iskele_stats.bilesen_dagilim.length} çeşit)
                    </span>
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {(showAllBilesenler
                      ? stats.iskele_stats.bilesen_dagilim
                      : stats.iskele_stats.bilesen_dagilim.slice(0, 5)
                    ).map((item, index) => {
                      const percentage = stats.iskele_stats.total > 0
                        ? Math.round((item.count / stats.iskele_stats.total) * 100)
                        : 0;

                      const colors = [
                        'bg-teal-600',
                        'bg-cyan-600',
                        'bg-sky-600',
                        'bg-indigo-600',
                        'bg-purple-600',
                        'bg-pink-600',
                        'bg-emerald-600',
                        'bg-amber-600',
                        'bg-rose-600',
                        'bg-violet-600',
                      ];

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="font-medium text-gray-700 truncate max-w-[60%]">{item.bileşen_adi}</span>
                            <span className="text-gray-600 flex-shrink-0">{item.count} (%{percentage})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div
                              className={`h-1.5 sm:h-2 rounded-full ${colors[index % colors.length]}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tümünü Gör / Gizle Butonu */}
                  {stats.iskele_stats.bilesen_dagilim.length > 5 && (
                    <button
                      onClick={() => setShowAllBilesenler(!showAllBilesenler)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {showAllBilesenler ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span>Gizle</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Tümünü Gör ({stats.iskele_stats.bilesen_dagilim.length - 5} daha)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Projeler */}
        <Card className="shadow-md" data-testid="projects-card">
          <CardHeader>
            <CardTitle className="text-lg">Projeler</CardTitle>
          </CardHeader>
          <CardContent>
            {projeler && projeler.length > 0 ? (
              <div className="space-y-3">
                {projeler.map((proje) => (
                  <button
                    key={proje.id}
                    onClick={() => handleProjectClick(proje.id)}
                    className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-800 hover:text-blue-700">{proje.proje_adi}</h3>
                    {proje.proje_kodu && (
                      <p className="text-xs text-blue-600 font-mono mt-1">{proje.proje_kodu}</p>
                    )}
                    {proje.aciklama && (
                      <p className="text-sm text-gray-600 mt-1">{proje.aciklama}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(proje.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Henüz proje bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RaporModal */}
      {showRaporModal && (
        <RaporModal
          open={showRaporModal}
          onClose={() => setShowRaporModal(false)}
          rapor={null}
          onSuccess={() => {
            setShowRaporModal(false);
            fetchStats();
          }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;