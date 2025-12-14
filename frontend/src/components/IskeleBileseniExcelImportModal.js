import React, { useState } from 'react';
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
import { useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IskeleBileseniExcelImportModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [projeler, setProjeler] = useState([]);
  const [selectedProje, setSelectedProje] = useState('');

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/iskele-bilesenleri/excel/template`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'iskele_bilesenleri_sablonu.xlsx');
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
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/iskele-bilesenleri/excel/import`, formData, {
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            İskele Bileşenleri Excel İçe Aktarma
          </DialogTitle>
          <DialogDescription>
            Toplu iskele bileşeni eklemek için Excel dosyanızı yükleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  1. Şablonu İndirin
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
              <h4 className="font-semibold text-gray-800 mb-2">2. Excel Dosyasını Yükleyin</h4>
              <p className="text-sm text-gray-600 mb-4">
                Hazırladığınız Excel dosyasını yükleyin
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Dosya Seç
                  </span>
                </Button>
              </label>
              {file && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✓ {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {result.imported_count > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-1">Başarılı</h4>
                      <p className="text-sm text-green-800">
                        {result.imported_count} iskele bileşeni içe aktarıldı
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Kapat
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IskeleBileseniExcelImportModal;
