import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileText, Download, Trash2, Calendar, Building, MapPin, Package, Eye, Image as ImageIcon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RaporDetailModal = ({ open, onClose, rapor }) => {
  const [dosyalar, setDosyalar] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (rapor) {
      fetchDosyalar();
    }
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [rapor]);

  const fetchDosyalar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dosyalar/${rapor.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDosyalar(response.data);
    } catch (error) {
      toast.error('Dosyalar yüklenemedi');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (4GB)
    if (file.size > 4 * 1024 * 1024 * 1024) {
      toast.error('Dosya boyutu 4GB\'dan büyük olamaz');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPG, PNG ve PDF formatları desteklenir');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API}/upload/${rapor.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Dosya yüklendi');
      fetchDosyalar();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Dosya yüklenemedi');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (dosyaId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/dosyalar/${dosyaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Dosya silindi');
      fetchDosyalar();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Dosya silinemedi');
    }
  };

  const handleDownloadFile = async (dosya) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dosyalar/${dosya.id}/indir`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', dosya.dosya_adi);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Dosya indirildi');
    } catch (error) {
      toast.error('Dosya indirilemedi');
    }
  };

  const handlePreviewFile = async (dosya) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dosyalar/${dosya.id}/indir`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      // Determine blob type from filename
      const fileExt = dosya.dosya_adi.split('.').pop().toLowerCase();
      const mimeTypes = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
      };
      const mimeType = mimeTypes[fileExt] || 'application/octet-stream';

      // For PDF files, use FileReader to create a data URL for better compatibility
      if (fileExt === 'pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewFile({ ...dosya, url: reader.result, mimeType, isPdfDataUrl: true });
          setShowPreview(true);
        };
        reader.onerror = () => {
          toast.error('PDF dosyası yüklenemedi');
        };
        reader.readAsDataURL(response.data);
      } else {
        // For images, use object URL
        const blob = new Blob([response.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        setPreviewFile({ ...dosya, url, mimeType, isPdfDataUrl: false });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error(`Dosya önizlenemiyor: ${error.response?.statusText || error.message}`);
    }
  };

  const isImageFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isPdfFile = (filename) => {
    return filename.toLowerCase().endsWith('.pdf');
  };

  const canEdit = user?.role === 'admin' || user?.role === 'inspector';

  if (!rapor) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="rapor-detail-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rapor Detayları</DialogTitle>
          <DialogDescription>{rapor.rapor_no}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{rapor.ekipman_adi}</h3>
                  <p className="text-gray-600">{rapor.rapor_no}</p>
                </div>
                {rapor.uygunluk && (
                  <span
                    className={rapor.uygunluk === 'Uygun' ? 'badge-success text-base' : 'badge-danger text-base'}
                    data-testid="detail-uygunluk-badge"
                  >
                    {rapor.uygunluk}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-gray-500 text-xs">Kategori</Label>
                    <p className="font-medium text-gray-800">{rapor.kategori}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label className="text-gray-500 text-xs">Firma</Label>
                    <p className="font-medium text-gray-800">{rapor.firma}</p>
                  </div>
                </div>

                {rapor.lokasyon && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label className="text-gray-500 text-xs">Lokasyon</Label>
                      <p className="font-medium text-gray-800">{rapor.lokasyon}</p>
                    </div>
                  </div>
                )}

                {rapor.gecerlilik_tarihi && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label className="text-gray-500 text-xs">Geçerlilik Tarihi</Label>
                      <p className="font-medium text-gray-800">{rapor.gecerlilik_tarihi}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-gray-800 mb-4">Ek Bilgiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {rapor.marka_model && (
                  <div>
                    <Label className="text-gray-500">Marka/Model</Label>
                    <p className="font-medium text-gray-800">{rapor.marka_model}</p>
                  </div>
                )}
                {rapor.seri_no && (
                  <div>
                    <Label className="text-gray-500">Seri No</Label>
                    <p className="font-medium text-gray-800">{rapor.seri_no}</p>
                  </div>
                )}
                {rapor.alt_kategori && (
                  <div>
                    <Label className="text-gray-500">Alt Kategori</Label>
                    <p className="font-medium text-gray-800">{rapor.alt_kategori}</p>
                  </div>
                )}
                {rapor.periyot && (
                  <div>
                    <Label className="text-gray-500">Periyot</Label>
                    <p className="font-medium text-gray-800">{rapor.periyot}</p>
                  </div>
                )}
              </div>

              {rapor.aciklama && (
                <div className="mt-4">
                  <Label className="text-gray-500">Açıklama</Label>
                  <p className="mt-1 text-gray-800 whitespace-pre-wrap">{rapor.aciklama}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dosyalar ({dosyalar.length})
                </h4>
                {canEdit && (
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".jpg,.jpeg,.png,.pdf"
                      data-testid="file-upload-input"
                    />
                    <Button
                      onClick={() => document.getElementById('file-upload').click()}
                      size="sm"
                      disabled={uploading}
                      data-testid="upload-file-button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
                    </Button>
                  </div>
                )}
              </div>

              {dosyalar.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Henüz dosya yüklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dosyalar.map((dosya) => (
                    <div
                      key={dosya.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      data-testid={`file-item-${dosya.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isImageFile(dosya.dosya_adi) ? (
                          <ImageIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{dosya.dosya_adi}</p>
                          <p className="text-xs text-gray-500">
                            {dosya.dosya_boyutu < 1024 * 1024 
                              ? `${(dosya.dosya_boyutu / 1024).toFixed(2)} KB`
                              : `${(dosya.dosya_boyutu / (1024 * 1024)).toFixed(2)} MB`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(isImageFile(dosya.dosya_adi) || isPdfFile(dosya.dosya_adi)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewFile(dosya)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            data-testid={`preview-file-${dosya.id}`}
                            title="Önizle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(dosya)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          data-testid={`download-file-${dosya.id}`}
                          title="İndir"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(dosya.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-file-${dosya.id}`}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Not:</strong> Maksimum dosya boyutu 4GB. Desteklenen formatlar: JPG, PNG, PDF
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* File Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Dosya Önizleme</DialogTitle>
            <DialogDescription>{previewFile?.dosya_adi}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 max-h-[70vh] overflow-auto">
            {previewFile && (
              <>
                {isImageFile(previewFile.dosya_adi) ? (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.dosya_adi}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Image load error');
                      toast.error('Resim yüklenemedi');
                    }}
                  />
                ) : isPdfFile(previewFile.dosya_adi) ? (
                  <div className="w-full h-[65vh]">
                    <embed
                      src={`${previewFile.url}#toolbar=1&navpanes=0&scrollbar=1`}
                      type="application/pdf"
                      className="w-full h-full rounded"
                      onError={(e) => {
                        console.error('PDF load error');
                      }}
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      PDF görünmüyorsa{' '}
                      <button
                        onClick={() => handleDownloadFile(previewFile)}
                        className="text-blue-600 hover:underline"
                      >
                        buradan indirebilirsiniz
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>Bu dosya tipi önizlenemiyor</p>
                    <Button
                      onClick={() => handleDownloadFile(previewFile)}
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      İndir
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreview(false);
                if (previewFile?.url) {
                  window.URL.revokeObjectURL(previewFile.url);
                }
                setPreviewFile(null);
              }}
            >
              Kapat
            </Button>
            {previewFile && (
              <Button onClick={() => handleDownloadFile(previewFile)}>
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default RaporDetailModal;