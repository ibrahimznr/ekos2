import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/Layout';
import RaporModal from '@/components/RaporModal';
import RaporDetailModal from '@/components/RaporDetailModal';
import { toast } from 'sonner';
import api from '@/utils/api';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Plus, 
  FolderKanban,
  Filter,
  X
} from 'lucide-react';

const ProjeRaporlar = () => {
  const { projeId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [proje, setProje] = useState(null);
  const [raporlar, setRaporlar] = useState([]);
  const [filteredRaporlar, setFilteredRaporlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Modal states
  const [showRaporModal, setShowRaporModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRapor, setSelectedRapor] = useState(null);
  const [editingRapor, setEditingRapor] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [uygunlukFilter, setUygunlukFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get unique categories from reports
  const kategoriler = [...new Set(raporlar.map(r => r.kategori).filter(Boolean))];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchProjeAndRaporlar();
  }, [projeId]);

  // Apply filters whenever filter values or raporlar change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, kategoriFilter, uygunlukFilter, raporlar]);

  const fetchProjeAndRaporlar = async () => {
    setLoading(true);
    try {
      // Fetch project details
      const projeResponse = await api.get(`/projeler/${projeId}`);
      setProje(projeResponse.data);
      
      // Fetch reports for this project
      const raporlarResponse = await api.get(`/raporlar?proje_id=${projeId}`);
      setRaporlar(raporlarResponse.data);
      setFilteredRaporlar(raporlarResponse.data);
    } catch (error) {
      console.error('Error fetching project data:', error);
      if (error.response?.status === 404) {
        toast.error('Proje bulunamadı');
        navigate('/');
      } else {
        toast.error('Veriler yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...raporlar];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.rapor_no?.toLowerCase().includes(search) ||
        r.ekipman_adi?.toLowerCase().includes(search) ||
        r.firma?.toLowerCase().includes(search) ||
        r.seri_no?.toLowerCase().includes(search) ||
        r.lokasyon?.toLowerCase().includes(search)
      );
    }
    
    // Category filter
    if (kategoriFilter && kategoriFilter !== 'all') {
      filtered = filtered.filter(r => r.kategori === kategoriFilter);
    }
    
    // Uygunluk filter
    if (uygunlukFilter && uygunlukFilter !== 'all') {
      filtered = filtered.filter(r => r.uygunluk === uygunlukFilter);
    }
    
    setFilteredRaporlar(filtered);
  }, [searchTerm, kategoriFilter, uygunlukFilter, raporlar]);

  const handleViewRapor = (rapor) => {
    setSelectedRapor(rapor);
    setShowDetailModal(true);
  };

  const handleEditRapor = (rapor) => {
    setEditingRapor(rapor);
    setShowRaporModal(true);
  };

  const handleDeleteRapor = async (raporId) => {
    if (!window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/raporlar/${raporId}`);
      toast.success('Rapor silindi');
      fetchProjeAndRaporlar();
    } catch (error) {
      toast.error('Rapor silinemedi');
    }
  };

  const handleRaporSaved = () => {
    setShowRaporModal(false);
    setEditingRapor(null);
    fetchProjeAndRaporlar();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setKategoriFilter('all');
    setUygunlukFilter('all');
  };

  const hasActiveFilters = searchTerm || (kategoriFilter && kategoriFilter !== 'all') || (uygunlukFilter && uygunlukFilter !== 'all');

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
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                <FolderKanban className="h-4 w-4" />
                <span>Proje Raporları</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold truncate">{proje?.proje_adi}</h1>
              {proje?.proje_kodu && (
                <p className="text-blue-200 font-mono text-sm mt-1">{proje.proje_kodu}</p>
              )}
              <p className="text-blue-100 text-sm mt-2">
                {filteredRaporlar.length} / {raporlar.length} rapor
                {hasActiveFilters && ' (filtrelenmiş)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {(user?.role === 'admin' || user?.role === 'inspector') && (
              <Button
                onClick={() => {
                  setEditingRapor(null);
                  setShowRaporModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Rapor
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrele
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rapor no, ekipman, firma ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori</label>
                  <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm kategoriler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm kategoriler</SelectItem>
                      {kategoriler.map(kat => (
                        <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Uygunluk</label>
                  <Select value={uygunlukFilter} onValueChange={setUygunlukFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm durumlar</SelectItem>
                      <SelectItem value="Uygun">Uygun</SelectItem>
                      <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {filteredRaporlar.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {hasActiveFilters ? 'Filtrelerle eşleşen rapor bulunamadı' : 'Bu projede henüz rapor yok'}
            </h3>
            <p className="text-gray-500 text-sm">
              {hasActiveFilters 
                ? 'Filtreleri değiştirerek tekrar deneyin'
                : 'Yeni rapor ekleyerek başlayın'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRaporlar.map((rapor) => (
              <Card 
                key={rapor.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleViewRapor(rapor)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {rapor.ekipman_adi || 'İsimsiz Ekipman'}
                      </h3>
                      <p className="text-sm text-blue-600 font-mono">{rapor.rapor_no}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rapor.durum === 'Aktif' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rapor.durum || 'Aktif'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rapor.uygunluk === 'Uygun' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {rapor.uygunluk}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><span className="text-gray-500">Kategori:</span> {rapor.kategori}</p>
                    <p><span className="text-gray-500">Firma:</span> {rapor.firma}</p>
                    {rapor.lokasyon && (
                      <p className="truncate"><span className="text-gray-500">Lokasyon:</span> {rapor.lokasyon}</p>
                    )}
                    {rapor.gecerlilik_tarihi && (
                      <p><span className="text-gray-500">Geçerlilik:</span> {rapor.gecerlilik_tarihi}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rapor Create/Edit Modal */}
      {showRaporModal && (
        <RaporModal
          isOpen={showRaporModal}
          onClose={() => {
            setShowRaporModal(false);
            setEditingRapor(null);
          }}
          onSuccess={handleRaporSaved}
          editingRapor={editingRapor}
          defaultProjeId={projeId}
          defaultProjeName={proje?.proje_adi}
        />
      )}

      {/* Rapor Detail Modal */}
      {showDetailModal && selectedRapor && (
        <RaporDetailModal
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRapor(null);
          }}
          rapor={selectedRapor}
          onEdit={(rapor) => {
            setShowDetailModal(false);
            setSelectedRapor(null);
            handleEditRapor(rapor);
          }}
          onDelete={async (raporId) => {
            setShowDetailModal(false);
            setSelectedRapor(null);
            await handleDeleteRapor(raporId);
          }}
        />
      )};
            setSelectedRapor(null);
          }}
          rapor={selectedRapor}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditRapor(selectedRapor);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            handleDeleteRapor(selectedRapor.id);
          }}
        />
      )}
    </Layout>
  );
};

export default ProjeRaporlar;
