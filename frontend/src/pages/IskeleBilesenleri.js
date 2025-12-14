import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Plus, Search, Eye, Edit, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
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

const IskeleBilesenleri = () => {
  const navigate = useNavigate();
  const [bilesenleri, setBilesenleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBilesenler, setSelectedBilesenler] = useState([]);
  const [user, setUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBilesenId, setDeleteBilesenId] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    firma_adi: '',
    uygunluk: '',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBilesenleri();
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

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setCurrentPage(1);
    setFilters(newFilters);
  };

  const handleDeleteClick = (bilesenId) => {
    setDeleteBilesenId(bilesenId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/iskele-bilesenleri/${deleteBilesenId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('İskele bileşeni silindi');
      fetchBilesenleri();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İskele bileşeni silinemedi');
    } finally {
      setShowDeleteDialog(false);
      setDeleteBilesenId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBilesenler.length === 0) {
      toast.error('Lütfen silmek için en az bir bileşen seçin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/iskele-bilesenleri/bulk-delete`, selectedBilesenler, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message);
      setSelectedBilesenler([]);
      fetchBilesenleri();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Toplu silme işlemi başarısız');
    }
  };

  const handleSelectAll = () => {
    if (selectedBilesenler.length === filteredBilesenleri.length) {
      setSelectedBilesenler([]);
    } else {
      setSelectedBilesenler(filteredBilesenleri.map(b => b.id));
    }
  };

  const handleToggleSelect = (bilesenId) => {
    setSelectedBilesenler(prev => 
      prev.includes(bilesenId) ? prev.filter(id => id !== bilesenId) : [...prev, bilesenId]
    );
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
    if (filters.firma_adi) {
      filtered = filtered.filter(b => b.firma_adi === filters.firma_adi);
    }
    
    // Uygunluk filter
    if (filters.uygunluk) {
      filtered = filtered.filter(b => b.uygunluk === filters.uygunluk);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedBilesenler.length === filteredBilesenleri.length && filteredBilesenleri.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">İskele Bileşenleri</h1>
              <p className="text-gray-600">
                {filteredBilesenleri.length} bileşen bulundu 
                {selectedBilesenler.length > 0 && ` (${selectedBilesenler.length} seçili)`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedBilesenler.length > 0 && canEdit && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Seçilenleri Sil ({selectedBilesenler.length})
              </Button>
            )}
            {canEdit && (
              <Button
                onClick={() => toast.info('Ekleme özelliği yakında eklenecek')}
                className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Bileşen
              </Button>
            )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Firma Filtresi</Label>
                  <Select value={filters.firma_adi} onValueChange={(value) => handleFilterChange({...filters, firma_adi: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Firmalar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm Firmalar</SelectItem>
                      {[...new Set(bilesenleri.map(b => b.firma_adi))].map(firma => (
                        <SelectItem key={firma} value={firma}>{firma}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uygunluk Filtresi</Label>
                  <Select value={filters.uygunluk} onValueChange={(value) => handleFilterChange({...filters, uygunluk: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      <SelectItem value="Uygun">Uygun</SelectItem>
                      <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(filters.firma_adi || filters.uygunluk) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setFilters({ firma_adi: '', uygunluk: '' })}
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

        {/* List */}
        {filteredBilesenleri.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">İskele bileşeni bulunamadı</p>
                <p className="text-sm">Yeni bir bileşen oluşturarak başlayabilirsiniz</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {paginatedBilesenleri.map((bilesen) => (
                <Card key={bilesen.id} className="card-hover shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      <Checkbox
                        checked={selectedBilesenler.includes(bilesen.id)}
                        onCheckedChange={() => handleToggleSelect(bilesen.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{bilesen.bileşen_adi}</h3>
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-sm text-gray-500 font-medium">Malzeme Kodu: {bilesen.malzeme_kodu}</p>
                                {bilesen.created_by_username && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {bilesen.created_by_username}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {bilesen.uygunluk && (
                                <span
                                  className={`${bilesen.uygunluk === 'Uygun' ? 'badge-success' : 'badge-danger'} text-xs sm:text-sm`}
                                >
                                  {bilesen.uygunluk}
                                </span>
                              )}
                            </div>
                          </div>
                        
                          {/* Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Adet:</span>
                              <span className="ml-2 font-medium text-gray-800">{bilesen.bileşen_adedi}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Firma:</span>
                              <span className="ml-2 font-medium text-gray-800">{bilesen.firma_adi}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Periyot:</span>
                              <span className="ml-2 font-medium text-gray-800">{bilesen.iskele_periyodu}</span>
                            </div>
                            {bilesen.gecerlilik_tarihi && (
                              <div>
                                <span className="text-gray-500">Geçerlilik:</span>
                                <span className="ml-2 font-medium text-gray-800">{bilesen.gecerlilik_tarihi}</span>
                              </div>
                            )}
                            {bilesen.gorseller && bilesen.gorseller.length > 0 && (
                              <div>
                                <span className="text-gray-500">Görseller:</span>
                                <span className="ml-2 font-medium text-gray-800">{bilesen.gorseller.length} adet</span>
                              </div>
                            )}
                          </div>
                        </div>
                      
                        {/* Actions */}
                        <div className="flex gap-2 lg:flex-col">
                          <Button
                            onClick={() => toast.info('Detay görüntüleme yakında eklenecek')}
                            variant="outline"
                            size="sm"
                            className="flex-1 lg:flex-none"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                onClick={() => toast.info('Düzenleme özelliği yakında eklenecek')}
                                variant="outline"
                                size="sm"
                                className="flex-1 lg:flex-none border-blue-600 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </Button>
                              <Button
                                onClick={() => handleDeleteClick(bilesen.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1 lg:flex-none border-red-600 text-red-700 hover:bg-red-50"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="shadow-md mt-6">
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
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İskele Bileşenini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bileşeni silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
