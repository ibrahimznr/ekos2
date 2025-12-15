import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import Layout from '@/components/Layout';
import IskeleBileseniModal from '@/components/IskeleBileseniModal';
import IskeleBileseniOnizlemeModal from '@/components/IskeleBileseniOnizlemeModal';
import IskeleBileseniExcelImportModal from '@/components/IskeleBileseniExcelImportModal';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Building2,
  Hash,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IskeleBilesenleri = () => {
  const navigate = useNavigate();
  const [bilesenleri, setBilesenleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showBilesenModal, setShowBilesenModal] = useState(false);
  const [showOnizlemeModal, setShowOnizlemeModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedBilesen, setSelectedBilesen] = useState(null);
  const [editBilesen, setEditBilesen] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, bilesen: null });
  
  // Filters
  const [filters, setFilters] = useState({
    firma_adi: 'all',
    uygunluk: 'all',
    proje_id: 'all',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  const [projeler, setProjeler] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBilesenleri();
    fetchProjeler();
  }, []);

  const fetchBilesenleri = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${API}/iskele-bilesenleri`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBilesenleri(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast.error('İskele bileşenleri yüklenemedi');
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
      console.error('Projeler yüklenemedi:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/iskele-bilesenleri/excel/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `iskele_bilesenleri_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Excel dışa aktarma başarısız');
    }
  };

  const handleDelete = async (bilesen) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/iskele-bilesenleri/${bilesen.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('İskele bileşeni silindi');
      fetchBilesenleri();
      setDeleteDialog({ open: false, bilesen: null });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İskele bileşeni silinemedi');
    }
  };

  const handleEdit = (bilesen) => {
    setEditBilesen(bilesen);
    setShowBilesenModal(true);
  };

  const handleOnizleme = (bilesen) => {
    setSelectedBilesen(bilesen);
    setShowOnizlemeModal(true);
  };

  const handleModalClose = () => {
    setShowBilesenModal(false);
    setEditBilesen(null);
  };

  // Filter by search term and filters
  const filteredBilesenleri = useMemo(() => {
    let filtered = bilesenleri;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.bileşen_adi?.toLowerCase().includes(search) ||
        b.malzeme_kodu?.toLowerCase().includes(search) ||
        b.firma_adi?.toLowerCase().includes(search)
      );
    }
    
    // Firma filter
    if (filters.firma_adi && filters.firma_adi !== 'all') {
      filtered = filtered.filter(b => b.firma_adi === filters.firma_adi);
    }
    
    // Uygunluk filter
    if (filters.uygunluk && filters.uygunluk !== 'all') {
      filtered = filtered.filter(b => b.uygunluk === filters.uygunluk);
    }
    
    // Proje filter
    if (filters.proje_id && filters.proje_id !== 'all') {
      filtered = filtered.filter(b => b.proje_id === filters.proje_id);
    }
    
    return filtered;
  }, [bilesenleri, searchTerm, filters]);

  // Paginate filtered results
  const paginatedBilesenleri = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBilesenleri.slice(startIndex, endIndex);
  }, [filteredBilesenleri, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBilesenleri.length / itemsPerPage);
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
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/raporlar')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">İskele Bileşenleri</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {filteredBilesenleri.length} bileşen bulundu
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <Button
                  onClick={() => {
                    setEditBilesen(null);
                    setShowBilesenModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bileşen Ekle
                </Button>
                <Button
                  onClick={() => setShowExcelModal(true)}
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Excel İçe Aktar
                </Button>
              </>
            )}
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="border-purple-600 text-purple-700 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel Dışa Aktar
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Bileşen adı, malzeme kodu veya firma ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Proje Filtresi</Label>
                  <Select value={filters.proje_id} onValueChange={(value) => handleFilterChange('proje_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Projeler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Projeler</SelectItem>
                      {projeler.map(proje => (
                        <SelectItem key={proje.id} value={proje.id}>{proje.proje_adi}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Firma Filtresi</Label>
                  <Select value={filters.firma_adi} onValueChange={(value) => handleFilterChange('firma_adi', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Firmalar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Firmalar</SelectItem>
                      {[...new Set(bilesenleri.map(b => b.firma_adi))].map(firma => (
                        <SelectItem key={firma} value={firma}>{firma}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uygunluk Filtresi</Label>
                  <Select value={filters.uygunluk} onValueChange={(value) => handleFilterChange('uygunluk', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Uygun">Uygun</SelectItem>
                      <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {((filters.proje_id !== 'all' && filters.proje_id) || (filters.firma_adi !== 'all' && filters.firma_adi) || (filters.uygunluk !== 'all' && filters.uygunluk)) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setFilters({ proje_id: 'all', firma_adi: 'all', uygunluk: 'all' })}
                      className="w-full"
                    >
                      Filtreleri Temizle
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Grid */}
        {paginatedBilesenleri.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">İskele bileşeni bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBilesenleri.map((bilesen) => (
              <Card key={bilesen.id} className="shadow-md hover:shadow-xl transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="p-6 space-y-4">
                  {/* Bileşen Adı */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                      {bilesen.bileşen_adi}
                    </h3>
                    <Badge
                      className={`ml-2 ${
                        bilesen.uygunluk === 'Uygun'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {bilesen.uygunluk === 'Uygun' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {bilesen.uygunluk}
                    </Badge>
                  </div>

                  {/* Malzeme Kodu */}
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-600">Malzeme Kodu:</span>
                    <span className="text-gray-800">{bilesen.malzeme_kodu}</span>
                  </div>

                  {/* Firma */}
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-600">Firma:</span>
                    <span className="text-gray-800">{bilesen.firma_adi}</span>
                  </div>

                  {/* Geçerlilik Tarihi */}
                  {bilesen.gecerlilik_tarihi && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-600">Geçerlilik:</span>
                      <span className="text-gray-800">{bilesen.gecerlilik_tarihi}</span>
                    </div>
                  )}

                  {/* Açıklama */}
                  {bilesen.aciklama && (
                    <div className="bg-gray-50 p-3 rounded-md border">
                      <p className="text-xs text-gray-600 line-clamp-2">{bilesen.aciklama}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOnizleme(bilesen)}
                      className="flex-1 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Önizleme
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(bilesen)}
                          className="flex-1 text-green-600 hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteDialog({ open: true, bilesen })}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="shadow-md">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Sayfa {currentPage} / {totalPages} 
                  <span className="ml-2">({filteredBilesenleri.length} bileşenden {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredBilesenleri.length)} arası)</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Önceki
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Sonraki
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <IskeleBileseniModal
        open={showBilesenModal}
        onClose={handleModalClose}
        onSuccess={fetchBilesenleri}
        editData={editBilesen}
      />

      <IskeleBileseniOnizlemeModal
        open={showOnizlemeModal}
        onClose={() => setShowOnizlemeModal(false)}
        bilesen={selectedBilesen}
      />

      <IskeleBileseniExcelImportModal
        open={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onSuccess={fetchBilesenleri}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, bilesen: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İskele Bileşenini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteDialog.bilesen?.bileşen_adi}</strong> isimli iskele bileşenini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteDialog.bilesen)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default IskeleBilesenleri;
