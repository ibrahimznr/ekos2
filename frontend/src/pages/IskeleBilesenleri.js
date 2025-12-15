import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Layout from '@/components/Layout';
import IskeleBileseniModal from '@/components/IskeleBileseniModal';
import IskeleBileseniExcelImportModal from '@/components/IskeleBileseniExcelImportModal';
import { toast } from 'sonner';
import { Plus, Search, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IskeleBilesenleri = () => {
  const navigate = useNavigate();
  const [bilesenleri, setBilesenleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showBilesenModal, setShowBilesenModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    firma_adi: 'all',
    uygunluk: 'all',
    proje_id: 'all',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">İskele Bileşenleri</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {filteredBilesenleri.length} bileşen bulundu
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <Button
                  onClick={() => setShowBilesenModal(true)}
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

        {/* Table */}
        <Card className="shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Bileşen Adı</TableHead>
                    <TableHead className="font-semibold">Malzeme Kodu</TableHead>
                    <TableHead className="font-semibold">Bileşen Adedi</TableHead>
                    <TableHead className="font-semibold">Firma Adı</TableHead>
                    <TableHead className="font-semibold">Geçerlilik Tarihi</TableHead>
                    <TableHead className="font-semibold">Uygunluk</TableHead>
                    <TableHead className="font-semibold">Not</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBilesenleri.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        İskele bileşeni bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBilesenleri.map((bilesen) => (
                      <TableRow key={bilesen.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{bilesen.bileşen_adi}</TableCell>
                        <TableCell>{bilesen.malzeme_kodu}</TableCell>
                        <TableCell>{bilesen.bileşen_adedi}</TableCell>
                        <TableCell>{bilesen.firma_adi}</TableCell>
                        <TableCell>{bilesen.gecerlilik_tarihi || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bilesen.uygunluk === 'Uygun'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {bilesen.uygunluk}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {bilesen.aciklama || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
        onClose={() => setShowBilesenModal(false)}
        onSuccess={fetchBilesenleri}
      />

      <IskeleBileseniExcelImportModal
        open={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onSuccess={fetchBilesenleri}
      />
    </Layout>
  );
};

export default IskeleBilesenleri;