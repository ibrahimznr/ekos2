import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExcelImportModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [projeler, setProjeler] = useState([]);
  const [selectedProje, setSelectedProje] = useState('');

  useEffect(() => {
    if (open) {
      fetchProjeler();
    }
  }, [open]);

  const fetchProjeler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/projeler`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjeler(response.data);
    } catch (error) {
      toast.error('Projeler yüklenemedi');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/excel/template`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rapor_sablonu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Şablon indirildi');
    } catch (error) {
      toast.error('Şablon indirilemedi');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Sadece Excel dosyaları (.xlsx, .xls) yüklenebilir');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedProje) {
      toast.error('Lütfen bir proje seçin');
      return;
    }
    
    if (!file) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('proje_id', selectedProje);

      const response = await axios.post(`${API}/excel/import`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      toast.success(response.data.message);
      
      if (response.data.imported_count > 0) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Excel içe aktarma başarısız');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setSelectedProje('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="excel-import-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            Excel İçe Aktarma
          </DialogTitle>
          <DialogDescription>
            Excel dosyasından toplu rapor içe aktarma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Selection */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">1. Proje Seçin</h4>
            <Select value={selectedProje} onValueChange={setSelectedProje}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Raporları hangi projeye eklensin?" />
              </SelectTrigger>
              <SelectContent>
                {projeler.map((proje) => (
                  <SelectItem key={proje.id} value={proje.id}>
                    {proje.proje_adi} {proje.proje_kodu ? `(${proje.proje_kodu})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  2. Şablonu İndirin
                </h4>
                <p className="text-sm text-blue-800">
                  Excel şablonunu indirin ve verilerinizi bu şablona göre hazırlayın.
                </p>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
                data-testid="download-template-button"
              >
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h4 className="font-semibold text-gray-800 mb-2">3. Excel Dosyasını Yükleyin</h4>
              <p className="text-sm text-gray-600 mb-4">
                Doldurduğunuz Excel dosyasını seçin
              </p>
              
              <input
                type="file"
                id="excel-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                data-testid="excel-file-input"
              />
              
              <Button
                onClick={() => document.getElementById('excel-upload').click()}
                variant="outline"
                data-testid="select-file-button"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Dosya Seç
              </Button>
              
              {file && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-800">
                    Seçili dosya: <span className="text-blue-600">{file.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-1">Başarılı</h4>
                    <p className="text-sm text-green-800">
                      {result.imported_count} rapor başarıyla içe aktarıldı
                    </p>
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">Hatalar ({result.errors.length})</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-800">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Önemli Notlar:</h4>
            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>Ekipman Adı, Kategori ve Firma alanları zorunludur</li>
              <li>Geçerlilik Tarihi formatı: YYYY-MM-DD (2025-12-31)</li>
              <li>Periyot: 3 Aylık, 6 Aylık veya 12 Aylık olmalıdır</li>
              <li>Uygunluk: Uygun veya Uygun Değil olmalıdır</li>
              <li>Boş satırlar atlanır</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="close-import-button">
            Kapat
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedProje || !file || uploading}
            data-testid="upload-excel-button"
          >
            {uploading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;