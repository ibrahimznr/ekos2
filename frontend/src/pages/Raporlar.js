import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import RaporModal from '@/components/RaporModal';
import RaporDetailModal from '@/components/RaporDetailModal';
import ExcelImportModal from '@/components/ExcelImportModal';
import FiltrelemePanel from '@/components/FiltrelemePanel';
import { toast } from 'sonner';
import { Plus, Search, Download, Upload, Eye, Edit, Trash2, FileText, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Raporlar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [raporlar, setRaporlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    kategori: '',
    periyot: '',
    uygunluk: '',
  });
  
  const [showRaporModal, setShowRaporModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [selectedRapor, setSelectedRapor] = useState(null);
  const [deleteRaporId, setDeleteRaporId] = useState(null);
  const [selectedRaporlar, setSelectedRaporlar] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Check if we have filtered reports from Dashboard
    if (location.state?.filteredReports) {
      setRaporlar(location.state.filteredReports);
      setLoading(false);
      toast.success(`${location.state.filterType}: ${location.state.filteredReports.length} rapor`);
    } else if (location.state?.filterProjeId) {
      fetchRaporlarByProje(location.state.filterProjeId);
    } else {
      fetchRaporlar();
    }
  }, []);

  const fetchRaporlar = async (customFilters = {}, retryCount = 0) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('arama', searchTerm);
      if (customFilters.kategori || filters.kategori) params.append('kategori', customFilters.kategori || filters.kategori);
      if (customFilters.periyot || filters.periyot) params.append('periyot', customFilters.periyot || filters.periyot);
      if (customFilters.uygunluk || filters.uygunluk) params.append('uygunluk', customFilters.uygunluk || filters.uygunluk);
      
      // Add limit for better performance
      params.append('limit', '500');
      
      const response = await axios.get(`${API}/raporlar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });
      setRaporlar(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (retryCount < 2) {
        setTimeout(() => fetchRaporlar(customFilters, retryCount + 1), 1000);
      } else {
        toast.error('Raporlar yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRaporlar();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchRaporlar(newFilters);
  };

  const handleCreateRapor = () => {
    setSelectedRapor(null);
    setShowRaporModal(true);
  };

  const handleEditRapor = (rapor) => {
    setSelectedRapor(rapor);
    setShowRaporModal(true);
  };

  const handleViewRapor = (rapor) => {
    setSelectedRapor(rapor);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (raporId) => {
    setDeleteRaporId(raporId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/raporlar/${deleteRaporId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Rapor silindi');
      fetchRaporlar();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Rapor silinemedi');
    } finally {
      setShowDeleteDialog(false);
      setDeleteRaporId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRaporlar.length === 0) {
      toast.error('Lütfen silmek için en az bir rapor seçin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/raporlar/bulk-delete`, selectedRaporlar, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message);
      setSelectedRaporlar([]);
      fetchRaporlar();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Toplu silme işlemi başarısız');
    }
  };

  const handleSelectAll = () => {
    if (selectedRaporlar.length === raporlar.length) {
      setSelectedRaporlar([]);
    } else {
      setSelectedRaporlar(raporlar.map(r => r.id));
    }
  };

  const handleToggleSelect = (raporId) => {
    setSelectedRaporlar(prev => 
      prev.includes(raporId) ? prev.filter(id => id !== raporId) : [...prev, raporId]
    );
  };

  const fetchRaporlarByProje = async (projeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/raporlar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const filtered = response.data.filter(r => r.proje_id === projeId);
      setRaporlar(filtered);
      setLoading(false);
      
      if (filtered.length > 0) {
        toast.success(`Proje raporları: ${filtered.length} rapor bulundu`);
      } else {
        toast.info('Bu proje için henüz rapor oluşturulmamış');
      }
    } catch (error) {
      toast.error('Raporlar yüklenemedi');
      setLoading(false);
    }
  };

  const handleToggleDurum = async (raporId, currentDurum) => {
    try {
      const token = localStorage.getItem('token');
      
      // Optimistic update
      setRaporlar(prev => prev.map(r => 
        r.id === raporId 
          ? { ...r, durum: currentDurum === 'Aktif' ? 'Pasif' : 'Aktif' }
          : r
      ));
      
      const response = await axios.patch(`${API}/raporlar/${raporId}/durum`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success(response.data.message);
    } catch (error) {
      // Revert on error
      setRaporlar(prev => prev.map(r => 
        r.id === raporId 
          ? { ...r, durum: currentDurum }
          : r
      ));
      toast.error(error.response?.data?.detail || 'Durum güncellenemedi');
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/excel/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `raporlar_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Excel export başarısız');
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'inspector';

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedRaporlar.length === raporlar.length && raporlar.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Raporlar</h1>
              <p className="text-gray-600">
                {raporlar.length} rapor bulundu 
                {selectedRaporlar.length > 0 && ` (${selectedRaporlar.length} seçili)`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRaporlar.length > 0 && canEdit && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                data-testid="bulk-delete-reports-button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Seçilenleri Sil ({selectedRaporlar.length})
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  onClick={handleCreateRapor}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-sm"
                  data-testid="create-report-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Rapor
                </Button>
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="outline"
                  className="border-blue-600 text-blue-700 hover:bg-blue-50"
                  data-testid="import-excel-button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Excel İçe Aktar
                </Button>
              </>
            )}
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
              data-testid="export-excel-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel İndir
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rapor no, ekipman adı veya firma ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
                <Button onClick={handleSearch} data-testid="search-button">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Filters */}
              <FiltrelemePanel filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {raporlar.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Rapor bulunamadı</p>
                <p className="text-sm">Yeni bir rapor oluşturarak başlayabilirsiniz</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {raporlar.map((rapor) => (
              <Card key={rapor.id} className="card-hover shadow-md" data-testid={`report-card-${rapor.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Checkbox
                      checked={selectedRaporlar.includes(rapor.id)}
                      onCheckedChange={() => handleToggleSelect(rapor.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{rapor.ekipman_adi}</h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="text-sm text-gray-500 font-medium">{rapor.rapor_no}</p>
                              {rapor.created_by_username && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {rapor.created_by_username}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Durum Toggle */}
                            {canEdit && (
                              <Button
                                onClick={() => handleToggleDurum(rapor.id, rapor.durum || 'Aktif')}
                                size="sm"
                                className={`
                                  ${(rapor.durum || 'Aktif') === 'Aktif' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-gray-400 hover:bg-gray-500 text-white'
                                  }
                                  text-xs sm:text-sm px-2 sm:px-3 py-1 min-w-[60px] sm:min-w-[70px]
                                `}
                                data-testid={`toggle-status-${rapor.id}`}
                              >
                                {(rapor.durum || 'Aktif') === 'Aktif' ? '✓ Aktif' : '⏸ Pasif'}
                              </Button>
                            )}
                            {rapor.uygunluk && (
                              <span
                                className={`${rapor.uygunluk === 'Uygun' ? 'badge-success' : 'badge-danger'} text-xs sm:text-sm`}
                                data-testid={`uygunluk-badge-${rapor.id}`}
                              >
                                {rapor.uygunluk}
                              </span>
                            )}
                          </div>
                        </div>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Kategori:</span>
                          <span className="ml-2 font-medium text-gray-800">{rapor.kategori}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Firma:</span>
                          <span className="ml-2 font-medium text-gray-800">{rapor.firma}</span>
                        </div>
                        {rapor.lokasyon && (
                          <div>
                            <span className="text-gray-500">Lokasyon:</span>
                            <span className="ml-2 font-medium text-gray-800">{rapor.lokasyon}</span>
                          </div>
                        )}
                        {rapor.periyot && (
                          <div>
                            <span className="text-gray-500">Periyot:</span>
                            <span className="ml-2 font-medium text-gray-800">{rapor.periyot}</span>
                          </div>
                        )}
                        {rapor.gecerlilik_tarihi && (
                          <div>
                            <span className="text-gray-500">Geçerlilik:</span>
                            <span className="ml-2 font-medium text-gray-800">{rapor.gecerlilik_tarihi}</span>
                          </div>
                        )}
                        {rapor.marka_model && (
                          <div>
                            <span className="text-gray-500">Marka/Model:</span>
                            <span className="ml-2 font-medium text-gray-800">{rapor.marka_model}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        onClick={() => handleViewRapor(rapor)}
                        variant="outline"
                        size="sm"
                        className="flex-1 lg:flex-none"
                        data-testid={`view-report-${rapor.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            onClick={() => handleEditRapor(rapor)}
                            variant="outline"
                            size="sm"
                            className="flex-1 lg:flex-none border-blue-600 text-blue-700 hover:bg-blue-50"
                            data-testid={`edit-report-${rapor.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(rapor.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1 lg:flex-none border-red-600 text-red-700 hover:bg-red-50"
                            data-testid={`delete-report-${rapor.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showRaporModal && (
        <RaporModal
          open={showRaporModal}
          onClose={() => {
            setShowRaporModal(false);
            setSelectedRapor(null);
          }}
          rapor={selectedRapor}
          onSuccess={fetchRaporlar}
        />
      )}

      {showDetailModal && (
        <RaporDetailModal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRapor(null);
          }}
          rapor={selectedRapor}
        />
      )}

      {showImportModal && (
        <ExcelImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchRaporlar}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Raporu Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu raporu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve rapora ait tüm dosyalar da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-button">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-button"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Raporlar;