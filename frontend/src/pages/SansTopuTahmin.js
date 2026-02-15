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
  Search,
  FileSpreadsheet,
  Trash2,
  Loader2,
  RefreshCw,
  Sparkles,
  CircleDot,
  Target,
  Hash,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Dice5
} from 'lucide-react';

const SansTopuTahmin = () => {
  // Stats
  const [totalCombinations, setTotalCombinations] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

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
      setSearchResult(null);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Önbellek temizlenirken hata oluştu');
    } finally {
      setClearing(false);
    }
  };

  // Search combination
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Lütfen bir kombinasyon girin');
      return;
    }
    try {
      setSearching(true);
      setSearchResult(null);
      const response = await api.post('/kombinasyonlar/search', {
        combination_str: searchQuery
      });
      setSearchResult(response.data);
      if (response.data.found) {
        toast.success(response.data.message);
      } else {
        toast.info(response.data.message);
      }
    } catch (error) {
      toast.error('Arama yapılırken hata oluştu');
    } finally {
      setSearching(false);
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
              Rastgele kombinasyon üretin, arayın ve Excel'e aktarın
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

        {/* Search Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-blue-600" />
              Kombinasyon Ara
            </CardTitle>
            <CardDescription>
              Format: <code className="bg-gray-100 px-2 py-1 rounded text-sm">5,12,23,27,34+8</code> veya{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">5-12-23-27-34-8</code> veya{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">5 12 23 27 34 8</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Örn: 5,12,23,27,34+8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                data-testid="search-input"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || totalCombinations === 0}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                data-testid="search-btn"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aranıyor...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Kombinasyonu Ara
                  </>
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResult && (
              <div className={`p-4 rounded-lg border ${
                searchResult.found 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {searchResult.found ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      searchResult.found ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {searchResult.message}
                    </p>
                    
                    {searchResult.found && searchResult.indices.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Bulunan Sıralar:</p>
                        <div className="flex flex-wrap gap-2">
                          {searchResult.indices.slice(0, 20).map((index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              #{index.toLocaleString('tr-TR')}
                            </Badge>
                          ))}
                          {searchResult.indices.length > 20 && (
                            <Badge variant="outline">
                              +{(searchResult.indices.length - 20).toLocaleString('tr-TR')} daha
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {searchResult.combination && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-600 mb-2">Aranan Kombinasyon:</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {searchResult.combination.slice(0, 5).map((num, i) => (
                            <span 
                              key={i}
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md"
                            >
                              {num}
                            </span>
                          ))}
                          <span className="text-gray-400 text-xl mx-1">+</span>
                          <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-md">
                            {searchResult.combination[5]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
