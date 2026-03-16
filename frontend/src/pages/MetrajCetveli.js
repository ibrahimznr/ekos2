import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  MoreVertical,
  Copy,
  Edit2,
  Loader2,
  Calculator,
  ChevronLeft,
  FolderOpen,
  FilePlus,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Birim seçenekleri
const BIRIM_OPTIONS = [
  { value: 'Adet', label: 'Adet' },
  { value: 'm', label: 'Metre (m)' },
  { value: 'm²', label: 'Metrekare (m²)' },
  { value: 'm³', label: 'Metreküp (m³)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Ton' },
  { value: 'lt', label: 'Litre (lt)' },
  { value: 'takım', label: 'Takım' },
  { value: 'set', label: 'Set' },
  { value: 'paket', label: 'Paket' },
  { value: 'kutu', label: 'Kutu' },
  { value: 'top', label: 'Top' },
  { value: 'rulo', label: 'Rulo' },
];

// Boş satır şablonu
const EMPTY_ROW = {
  id: null,
  poz_no: '',
  malzeme_adi: '',
  birim: 'Adet',
  miktar: 0,
  birim_fiyat: 0,
  birim_agirlik: null,
  toplam: 0,
  toplam_agirlik: null,
  aciklama: '',
};

const MetrajCetveli = () => {
  // State
  const [cetveller, setCetveller] = useState([]);
  const [selectedCetvel, setSelectedCetvel] = useState(null);
  const [satirlar, setSatirlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modal states
  const [showNewCetvelModal, setShowNewCetvelModal] = useState(false);
  const [showEditCetvelModal, setShowEditCetvelModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCetvelId, setDeletingCetvelId] = useState(null);

  // New cetvel form
  const [newCetvelForm, setNewCetvelForm] = useState({
    baslik: '',
    aciklama: '',
  });

  // Fetch all cetveller
  const fetchCetveller = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/metraj/');
      setCetveller(response.data);
    } catch (error) {
      toast.error('Metraj cetvelleri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single cetvel
  const fetchCetvel = useCallback(async (cetvelId) => {
    setLoading(true);
    try {
      const response = await api.get(`/metraj/${cetvelId}`);
      setSelectedCetvel(response.data);
      setSatirlar(response.data.satirlar || []);
    } catch (error) {
      toast.error('Metraj cetveli yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCetveller();
  }, [fetchCetveller]);

  // Create new cetvel
  const handleCreateCetvel = async () => {
    if (!newCetvelForm.baslik.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/metraj/', newCetvelForm);
      toast.success('Metraj cetveli oluşturuldu');
      setShowNewCetvelModal(false);
      setNewCetvelForm({ baslik: '', aciklama: '' });
      fetchCetveller();
      // Auto-select the new cetvel
      fetchCetvel(response.data.id);
    } catch (error) {
      toast.error('Metraj cetveli oluşturulamadı');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Delete cetvel
  const handleDeleteCetvel = async () => {
    if (!deletingCetvelId) return;

    setSaving(true);
    try {
      await api.delete(`/metraj/${deletingCetvelId}`);
      toast.success('Metraj cetveli silindi');
      setShowDeleteConfirm(false);
      setDeletingCetvelId(null);
      if (selectedCetvel?.id === deletingCetvelId) {
        setSelectedCetvel(null);
        setSatirlar([]);
      }
      fetchCetveller();
    } catch (error) {
      toast.error('Metraj cetveli silinemedi');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate row totals
  const calculateRowTotals = (row) => {
    const miktar = parseFloat(row.miktar) || 0;
    const birimFiyat = parseFloat(row.birim_fiyat) || 0;
    const birimAgirlik = row.birim_agirlik ? parseFloat(row.birim_agirlik) : null;

    return {
      ...row,
      toplam: Math.round(miktar * birimFiyat * 100) / 100,
      toplam_agirlik: birimAgirlik !== null ? Math.round(miktar * birimAgirlik * 100) / 100 : null,
    };
  };

  // Add new row
  const handleAddRow = () => {
    const newRow = {
      ...EMPTY_ROW,
      id: `temp-${Date.now()}`,
      sira_no: satirlar.length + 1,
    };
    setSatirlar([...satirlar, newRow]);
  };

  // Update row
  const handleUpdateRow = (index, field, value) => {
    const updated = [...satirlar];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    // Recalculate totals
    updated[index] = calculateRowTotals(updated[index]);
    setSatirlar(updated);
  };

  // Delete row
  const handleDeleteRow = (index) => {
    const updated = satirlar.filter((_, i) => i !== index);
    // Renumber
    updated.forEach((row, i) => {
      row.sira_no = i + 1;
    });
    setSatirlar(updated);
  };

  // Duplicate row
  const handleDuplicateRow = (index) => {
    const original = satirlar[index];
    const duplicate = {
      ...original,
      id: `temp-${Date.now()}`,
      poz_no: `${original.poz_no}-KOPYA`,
      sira_no: satirlar.length + 1,
    };
    setSatirlar([...satirlar, duplicate]);
    toast.success('Satır kopyalandı');
  };

  // Save all rows (bulk update)
  const handleSaveAll = async () => {
    if (!selectedCetvel) return;

    setSaving(true);
    try {
      // Clean temp IDs
      const cleanedSatirlar = satirlar.map((row) => ({
        ...row,
        id: row.id?.startsWith('temp-') ? null : row.id,
      }));

      await api.put(`/metraj/${selectedCetvel.id}/bulk-update`, cleanedSatirlar);
      toast.success('Metraj cetveli kaydedildi');
      fetchCetvel(selectedCetvel.id);
    } catch (error) {
      toast.error('Kaydetme işlemi başarısız');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!selectedCetvel) return;

    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/api/metraj/${selectedCetvel.id}/export-excel`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metraj_${selectedCetvel.baslik.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Excel export başarısız');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Calculate grand totals
  const genelToplam = satirlar.reduce((sum, row) => sum + (parseFloat(row.toplam) || 0), 0);
  const genelAgirlik = satirlar.reduce((sum, row) => {
    const agirlik = row.toplam_agirlik;
    return agirlik !== null ? sum + (parseFloat(agirlik) || 0) : sum;
  }, 0);
  const hasAgirlik = satirlar.some((row) => row.birim_agirlik !== null && row.birim_agirlik !== '');

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(value);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="metraj-cetveli-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {selectedCetvel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCetvel(null);
                  setSatirlar([]);
                }}
                className="mr-2"
                data-testid="back-to-list-btn"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedCetvel ? selectedCetvel.baslik : 'Metraj Cetvelleri'}
              </h1>
              <p className="text-sm text-gray-500">
                {selectedCetvel
                  ? selectedCetvel.aciklama || 'Metraj ve pozlandırma tablosu'
                  : 'Metraj ve pozlandırma modülü'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCetvel ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => fetchCetvel(selectedCetvel.id)}
                  disabled={loading}
                  data-testid="refresh-cetvel-btn"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={exporting || satirlar.length === 0}
                  data-testid="export-excel-btn"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Excel
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="save-all-btn"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Kaydet
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowNewCetvelModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="new-cetvel-btn"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Yeni Cetvel
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {!selectedCetvel ? (
          // Cetvel List View
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : cetveller.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <FolderOpen className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Henüz metraj cetveli yok</p>
                <p className="text-sm mb-4">İlk metraj cetvelinizi oluşturun</p>
                <Button
                  onClick={() => setShowNewCetvelModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Cetvel Oluştur
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cetveller.map((cetvel) => (
                  <div
                    key={cetvel.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => fetchCetvel(cetvel.id)}
                    data-testid={`cetvel-item-${cetvel.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Calculator className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cetvel.baslik}</h3>
                        <p className="text-sm text-gray-500">
                          {cetvel.satirlar?.length || 0} satır • {formatCurrency(cetvel.genel_toplam || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(cetvel.updated_at || cetvel.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchCetvel(cetvel.id);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCetvelId(cetvel.id);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Cetvel Detail / Editor View
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Toplam Satır</p>
                    <p className="text-xl font-bold text-gray-900">{satirlar.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">₺</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Genel Toplam</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(genelToplam)}</p>
                  </div>
                </div>
              </div>
              {hasAgirlik && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Scale className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Toplam Ağırlık</p>
                      <p className="text-xl font-bold text-amber-600">
                        {genelAgirlik.toLocaleString('tr-TR')} kg
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead className="w-24">Poz No</TableHead>
                      <TableHead className="min-w-[200px]">Malzeme Adı</TableHead>
                      <TableHead className="w-24">Birim</TableHead>
                      <TableHead className="w-24 text-right">Miktar</TableHead>
                      <TableHead className="w-32 text-right">Birim Fiyat (₺)</TableHead>
                      <TableHead className="w-28 text-right">Birim Ağırlık</TableHead>
                      <TableHead className="w-32 text-right">Toplam (₺)</TableHead>
                      <TableHead className="w-40">Açıklama</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {satirlar.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          Henüz satır eklenmemiş. Aşağıdaki butona tıklayarak satır ekleyin.
                        </TableCell>
                      </TableRow>
                    ) : (
                      satirlar.map((row, index) => (
                        <TableRow key={row.id || index} className="hover:bg-gray-50">
                          <TableCell className="text-center font-medium text-gray-500">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.poz_no || ''}
                              onChange={(e) => handleUpdateRow(index, 'poz_no', e.target.value)}
                              placeholder="P-001"
                              className="h-8 text-sm"
                              data-testid={`row-${index}-poz_no`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.malzeme_adi || ''}
                              onChange={(e) => handleUpdateRow(index, 'malzeme_adi', e.target.value)}
                              placeholder="Malzeme adı"
                              className="h-8 text-sm"
                              data-testid={`row-${index}-malzeme_adi`}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.birim || 'Adet'}
                              onValueChange={(value) => handleUpdateRow(index, 'birim', value)}
                            >
                              <SelectTrigger className="h-8 text-sm" data-testid={`row-${index}-birim`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BIRIM_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={row.miktar || ''}
                              onChange={(e) => handleUpdateRow(index, 'miktar', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="h-8 text-sm text-right"
                              min="0"
                              step="0.01"
                              data-testid={`row-${index}-miktar`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={row.birim_fiyat || ''}
                              onChange={(e) => handleUpdateRow(index, 'birim_fiyat', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-8 text-sm text-right"
                              min="0"
                              step="0.01"
                              data-testid={`row-${index}-birim_fiyat`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={row.birim_agirlik ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateRow(index, 'birim_agirlik', val === '' ? null : parseFloat(val));
                              }}
                              placeholder="-"
                              className="h-8 text-sm text-right"
                              min="0"
                              step="0.01"
                              data-testid={`row-${index}-birim_agirlik`}
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(row.toplam || 0)}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.aciklama || ''}
                              onChange={(e) => handleUpdateRow(index, 'aciklama', e.target.value)}
                              placeholder="Açıklama"
                              className="h-8 text-sm"
                              data-testid={`row-${index}-aciklama`}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" data-testid={`row-${index}-actions`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicateRow(index)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Kopyala
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteRow(index)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Add Row Button */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <Button
                  variant="outline"
                  onClick={handleAddRow}
                  className="w-full border-dashed"
                  data-testid="add-row-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Satır Ekle
                </Button>
              </div>

              {/* Totals Row */}
              {satirlar.length > 0 && (
                <div className="p-4 border-t-2 border-blue-200 bg-blue-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="font-semibold text-blue-800">GENEL TOPLAM</span>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                      <span className="text-2xl font-bold text-green-600" data-testid="genel-toplam">
                        {formatCurrency(genelToplam)}
                      </span>
                      {hasAgirlik && (
                        <span className="text-lg font-semibold text-amber-600" data-testid="genel-agirlik">
                          {genelAgirlik.toLocaleString('tr-TR')} kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Cetvel Modal */}
        <Dialog open={showNewCetvelModal} onOpenChange={setShowNewCetvelModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Metraj Cetveli</DialogTitle>
              <DialogDescription>
                Yeni bir metraj cetveli oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="baslik">Başlık *</Label>
                <Input
                  id="baslik"
                  value={newCetvelForm.baslik}
                  onChange={(e) => setNewCetvelForm({ ...newCetvelForm, baslik: e.target.value })}
                  placeholder="Örn: A Blok Demir İşleri"
                  data-testid="new-cetvel-baslik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aciklama">Açıklama</Label>
                <Textarea
                  id="aciklama"
                  value={newCetvelForm.aciklama}
                  onChange={(e) => setNewCetvelForm({ ...newCetvelForm, aciklama: e.target.value })}
                  placeholder="Opsiyonel açıklama"
                  rows={3}
                  data-testid="new-cetvel-aciklama"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCetvelModal(false);
                  setNewCetvelForm({ baslik: '', aciklama: '' });
                }}
              >
                İptal
              </Button>
              <Button
                onClick={handleCreateCetvel}
                disabled={saving || !newCetvelForm.baslik.trim()}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="create-cetvel-btn"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Metraj Cetvelini Sil</DialogTitle>
              <DialogDescription>
                Bu metraj cetvelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingCetvelId(null);
                }}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCetvel}
                disabled={saving}
                data-testid="confirm-delete-btn"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MetrajCetveli;
