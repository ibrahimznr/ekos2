import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/utils/api';
import { downloadExcel } from '@/utils/fileDownload';
import {
  Database,
  FileSpreadsheet,
  Trash2,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Hash,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Dice5,
  Filter,
  RotateCcw,
  ListFilter,
  Search
} from 'lucide-react';

const SansTopuTahmin = () => {
  // Stats
  const [totalCombinations, setTotalCombinations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchingId, setSearchingId] = useState(false);

  // Filter selections
  const [selectedMainNumbers, setSelectedMainNumbers] = useState([]);
  const [selectedBonus, setSelectedBonus] = useState(null);

  // Filter results
  const [filterResult, setFilterResult] = useState(null);

  // ID Search
  const [searchId, setSearchId] = useState('');
  const [idSearchResult, setIdSearchResult] = useState(null);

  // Sample combinations
  const [sampleCombinations, setSampleCombinations] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Fetch stats on mount
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/kombinasyonlar/stats');
      setTotalCombinations(response.data.total_combinations);
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sample combinations
  const fetchSamples = useCallback(async () => {
    try {
      setLoadingSamples(true);
      const response = await api.get('/kombinasyonlar/sample?count=5');
      setSampleCombinations(response.data);
    } catch (error) {
      console.error('Sample fetch error:', error);
      setSampleCombinations([]);
    } finally {
      setLoadingSamples(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (totalCombinations > 0) {
      fetchSamples();
    }
  }, [totalCombinations, fetchSamples]);

  // Generate 1 million combinations
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await api.post('/kombinasyonlar/generate', {
        num_combinations: 1000000
      });
      setTotalCombinations(response.data.total_count);
      toast.success(response.data.message);
      fetchSamples();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kombinasyon üretilirken hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  // Clear cache
  const handleClear = async () => {
    if (!window.confirm('Tüm kombinasyonları silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      setClearing(true);
      const response = await api.post('/kombinasyonlar/clear');
      setTotalCombinations(0);
      setSampleCombinations([]);
      setFilterResult(null);
      setIdSearchResult(null);
      setSearchId('');
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Önbellek temizlenirken hata oluştu');
    } finally {
      setClearing(false);
    }
  };

  // Search by ID
  const handleIdSearch = async () => {
    const id = parseInt(searchId, 10);
    if (isNaN(id) || id <= 0) {
      toast.error('Lütfen geçerli bir ID numarası girin');
      return;
    }
    
    if (id > totalCombinations) {
      toast.error(`ID ${totalCombinations.toLocaleString('tr-TR')} veya daha küçük olmalıdır`);
      return;
    }
    
    try {
      setSearchingId(true);
      setIdSearchResult(null);
      const response = await api.get(`/kombinasyonlar/combination/${id}`);
      setIdSearchResult(response.data);
      toast.success(`#${id} numaralı kombinasyon bulundu`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Kombinasyon bulunamadı';
      toast.error(message);
      setIdSearchResult(null);
    } finally {
      setSearchingId(false);
    }
  };

  // Clear ID search
  const handleClearIdSearch = () => {
    setSearchId('');
    setIdSearchResult(null);
  };

  // Toggle main number selection
  const toggleMainNumber = (num) => {
    setSelectedMainNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else if (prev.length < 5) {
        return [...prev, num].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  // Toggle bonus selection
  const toggleBonus = (num) => {
    setSelectedBonus(prev => prev === num ? null : num);
  };

  // Clear filter selections
  const handleClearFilter = () => {
    setSelectedMainNumbers([]);
    setSelectedBonus(null);
    setFilterResult(null);
  };

  // Filter combinations
  const handleFilter = async () => {
    if (selectedMainNumbers.length !== 5) {
      toast.error('Lütfen tam olarak 5 ana sayı seçin');
      return;
    }
    
    try {
      setFiltering(true);
      setFilterResult(null);
      const response = await api.post('/kombinasyonlar/filter', {
        main_numbers: selectedMainNumbers,
        bonus_number: selectedBonus
      });
      setFilterResult(response.data);
      if (response.data.found) {
        toast.success(response.data.message);
      } else {
        toast.info(response.data.message);
      }
    } catch (error) {
      toast.error('Filtreleme yapılırken hata oluştu');
    } finally {
      setFiltering(false);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    if (totalCombinations === 0) {
      toast.error('Önce kombinasyon oluşturmanız gerekiyor!');
      return;
    }
    try {
      setExporting(true);
      const response = await api.get('/kombinasyonlar/export-excel', {
        responseType: 'blob'
      });
      
      const filename = `sans_topu_kombinasyonlari_${totalCombinations}.xlsx`;
      await downloadExcel(response.data, filename);
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Excel indirme hatası');
    } finally {
      setExporting(false);
    }
  };

  // Refresh samples
  const handleRefreshSamples = () => {
    if (totalCombinations > 0) {
      fetchSamples();
    }
  };

  // Generate number grid (1-34 for main, 1-14 for bonus)
  const renderNumberGrid = (max, selected, onToggle, maxSelect, isBonus = false) => {
    const numbers = Array.from({ length: max }, (_, i) => i + 1);
    
    return (
      <div className={`grid gap-2 ${isBonus ? 'grid-cols-7' : 'grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-17'}`}>
        {numbers.map(num => {
          const isSelected = isBonus ? selected === num : selected.includes(num);
          const canSelect = isBonus ? true : selected.length < maxSelect || isSelected;
          
          return (
            <button
              key={num}
              onClick={() => onToggle(num)}
              disabled={!canSelect && !isSelected}
              className={`
                w-10 h-10 rounded-full font-semibold text-sm
                transition-all duration-200 
                border-2
                ${isSelected 
                  ? isBonus
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-600 shadow-lg scale-110'
                    : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-600 shadow-lg scale-110'
                  : canSelect
                    ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400 hover:scale-105'
                    : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                }
              `}
              data-testid={`${isBonus ? 'bonus' : 'main'}-number-${num}`}
            >
              {num}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="sans-topu-tahmin-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md">
                <Dice5 className="h-6 w-6 text-white" />
              </div>
              Şans Topu Tahmin Üretici
            </h1>
            <p className="text-gray-600 mt-1">
              Rastgele kombinasyon üretin, filtreleyin ve Excel'e aktarın
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Total Count */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Toplam Kombinasyon</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      totalCombinations.toLocaleString('tr-TR')
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                  data-testid="generate-btn"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Üretiliyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      1 Milyon Yeni Üret
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleClear}
                  disabled={clearing || totalCombinations === 0}
                  variant="destructive"
                  className="shadow-md"
                  data-testid="clear-btn"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Temizleniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Önbelleği Temizle
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combination Filter Panel */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListFilter className="h-5 w-5 text-emerald-600" />
              Kombinasyon Filtreleme
            </CardTitle>
            <CardDescription>
              5 ana sayı seçin (zorunlu) ve opsiyonel olarak 1 artı top seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Numbers (1-34) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">5</span>
                  Ana Sayılar (1-34)
                </h3>
                <Badge variant={selectedMainNumbers.length === 5 ? 'default' : 'secondary'} className={selectedMainNumbers.length === 5 ? 'bg-emerald-600' : ''}>
                  {selectedMainNumbers.length} / 5 seçildi
                </Badge>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                {renderNumberGrid(34, selectedMainNumbers, toggleMainNumber, 5, false)}
              </div>
              {selectedMainNumbers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Seçilen:</span>
                  {selectedMainNumbers.map(num => (
                    <span
                      key={num}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm flex items-center justify-center font-semibold shadow"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bonus Number (1-14) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">+</span>
                  Artı Top (1-14)
                  <span className="text-xs font-normal text-gray-500">(opsiyonel)</span>
                </h3>
                <Badge variant={selectedBonus ? 'default' : 'outline'} className={selectedBonus ? 'bg-amber-600' : ''}>
                  {selectedBonus ? `${selectedBonus} seçildi` : 'Seçilmedi'}
                </Badge>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                {renderNumberGrid(14, selectedBonus, toggleBonus, 1, true)}
              </div>
              {!selectedBonus && (
                <p className="text-sm text-gray-500 italic">
                  Artı top seçmezseniz, seçilen 5 ana sayı ile eşleşen tüm kombinasyonlar (1-14 arası her bonus) listelenecektir.
                </p>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <Button
                onClick={handleFilter}
                disabled={filtering || selectedMainNumbers.length !== 5 || totalCombinations === 0}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-md h-12"
                data-testid="filter-btn"
              >
                {filtering ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Filtreleniyor...
                  </>
                ) : (
                  <>
                    <Filter className="h-5 w-5 mr-2" />
                    Filtrele
                  </>
                )}
              </Button>
              <Button
                onClick={handleClearFilter}
                variant="outline"
                className="h-12"
                disabled={selectedMainNumbers.length === 0 && !selectedBonus && !filterResult}
                data-testid="clear-filter-btn"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Results */}
        {filterResult && (
          <Card className={`border-0 shadow-lg ${filterResult.found ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                {filterResult.found ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Filtrelenen Kombinasyonlar
              </CardTitle>
              <CardDescription>
                {filterResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filterResult.found && filterResult.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">
                          <Hash className="h-4 w-4 inline mr-1" />
                          Sıra
                        </TableHead>
                        <TableHead>Ana Sayılar</TableHead>
                        <TableHead className="w-24">Bonus</TableHead>
                        <TableHead>Format</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterResult.results.map((item) => (
                        <TableRow key={item.index}>
                          <TableCell className="font-mono font-bold text-gray-700">
                            #{item.index.toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.main_numbers.map((num, i) => (
                                <span
                                  key={i}
                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm flex items-center justify-center font-semibold shadow"
                                >
                                  {num}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm flex items-center justify-center font-semibold shadow">
                              {item.bonus_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                              {item.formatted}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filterResult.total_found > 100 && (
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      Toplam {filterResult.total_found.toLocaleString('tr-TR')} sonuçtan ilk 100 tanesi gösteriliyor.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                  <p className="text-gray-600">{filterResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sample Combinations */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                  Örnek Tahminler
                </CardTitle>
                <CardDescription>
                  Rastgele seçilmiş 5 kombinasyon
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshSamples}
                disabled={loadingSamples || totalCombinations === 0}
                data-testid="refresh-samples-btn"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingSamples ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {totalCombinations === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz kombinasyon oluşturulmadı</p>
                <p className="text-sm mt-1">Yukarıdaki "1 Milyon Yeni Üret" butonuna tıklayın</p>
              </div>
            ) : loadingSamples ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : sampleCombinations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Örnek yüklenemedi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">
                        <Hash className="h-4 w-4 inline mr-1" />
                        Sıra
                      </TableHead>
                      <TableHead>Ana Sayılar</TableHead>
                      <TableHead className="w-24">Bonus</TableHead>
                      <TableHead>Format</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleCombinations.map((item) => (
                      <TableRow key={item.index}>
                        <TableCell className="font-mono font-bold text-gray-700">
                          #{item.index.toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.main_numbers.map((num, i) => (
                              <span
                                key={i}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm flex items-center justify-center font-semibold shadow"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm flex items-center justify-center font-semibold shadow">
                            {item.bonus_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {item.formatted}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Excel Olarak Kaydet</p>
                  <p className="text-sm text-gray-600">
                    Tüm kombinasyonları Excel dosyasına aktarın (maks. 100.000 satır)
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting || totalCombinations === 0}
                className="bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-md"
                data-testid="export-btn"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    İndiriliyor...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel Olarak Kaydet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-0 shadow-lg bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Şans Topu Kuralları:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>5 ana sayı: 1-34 arasından seçilir</li>
                  <li>1 bonus sayı (Şans Topu): 1-14 arasından seçilir</li>
                  <li>Ana sayılar birbirinden farklı olmalıdır</li>
                  <li>Kombinasyonlar otomatik olarak sıralanır</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SansTopuTahmin;
