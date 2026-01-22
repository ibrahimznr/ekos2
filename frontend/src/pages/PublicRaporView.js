import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MapPin, 
  Building2, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Image as ImageIcon,
  FileIcon,
  Download,
  ExternalLink
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicRaporView = () => {
  const { raporId } = useParams();
  const [rapor, setRapor] = useState(null);
  const [medyaDosyalari, setMedyaDosyalari] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchRapor();
  }, [raporId]);

  const fetchRapor = async () => {
    try {
      const response = await axios.get(`${API}/raporlar/public/${raporId}`);
      setRapor(response.data.rapor);
      setMedyaDosyalari(response.data.medya_dosyalari || []);
    } catch (err) {
      console.error('Rapor yüklenemedi:', err);
      setError(err.response?.data?.detail || 'Rapor bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  const getUygunlukIcon = (uygunluk) => {
    switch (uygunluk) {
      case 'Uygun':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Uygun Değil':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getUygunlukColor = (uygunluk) => {
    switch (uygunluk) {
      case 'Uygun':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Uygun Değil':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Belirtilmemiş';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = (filename) => {
    const ext = filename?.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  };

  const isPdf = (filename) => {
    return filename?.toLowerCase().endsWith('.pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Rapor Bulunamadı</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = medyaDosyalari.filter(d => isImage(d.dosya_adi));
  const pdfs = medyaDosyalari.filter(d => isPdf(d.dosya_adi));
  const otherFiles = medyaDosyalari.filter(d => !isImage(d.dosya_adi) && !isPdf(d.dosya_adi));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Rapor Önizleme
          </h1>
          <p className="text-gray-600">Rapor No: {rapor.rapor_no}</p>
        </div>

        {/* Rapor Bilgileri */}
        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              {rapor.ekipman_adi || 'Ekipman Bilgisi'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Uygunluk Badge */}
            <div className="flex justify-center mb-6">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 ${getUygunlukColor(rapor.uygunluk)}`}>
                {getUygunlukIcon(rapor.uygunluk)}
                <span className="font-semibold text-lg">{rapor.uygunluk || 'Belirtilmemiş'}</span>
              </div>
            </div>

            {/* Bilgi Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Firma</p>
                  <p className="font-medium text-gray-800">{rapor.firma || 'Belirtilmemiş'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Şehir / Lokasyon</p>
                  <p className="font-medium text-gray-800">{rapor.sehir} {rapor.lokasyon && `/ ${rapor.lokasyon}`}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Kategori</p>
                  <p className="font-medium text-gray-800">{rapor.kategori} {rapor.alt_kategori && `/ ${rapor.alt_kategori}`}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Geçerlilik Tarihi</p>
                  <p className="font-medium text-gray-800">{rapor.gecerlilik_tarihi || 'Belirtilmemiş'}</p>
                </div>
              </div>

              {rapor.marka_model && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Marka / Model</p>
                    <p className="font-medium text-gray-800">{rapor.marka_model}</p>
                  </div>
                </div>
              )}

              {rapor.seri_no && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Seri No</p>
                    <p className="font-medium text-gray-800">{rapor.seri_no}</p>
                  </div>
                </div>
              )}

              {rapor.periyot && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Periyot</p>
                    <p className="font-medium text-gray-800">{rapor.periyot}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Oluşturulma Tarihi</p>
                  <p className="font-medium text-gray-800">{formatDate(rapor.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            {rapor.aciklama && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-gray-800 mb-2">Açıklama</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{rapor.aciklama}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medya Dosyaları */}
        {medyaDosyalari.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Medya Dosyaları ({medyaDosyalari.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Resimler */}
              {images.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Resimler ({images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(`${API}${img.url}`)}
                      >
                        <img
                          src={`${API}${img.url}`}
                          alt={img.dosya_adi}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF'ler */}
              {pdfs.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">PDF Dosyaları ({pdfs.length})</h4>
                  <div className="space-y-2">
                    {pdfs.map((pdf, idx) => (
                      <a
                        key={idx}
                        href={`${API}${pdf.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <FileIcon className="h-8 w-8 text-red-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{pdf.dosya_adi}</p>
                          <p className="text-sm text-gray-500">PDF Dosyası</p>
                        </div>
                        <ExternalLink className="h-5 w-5 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Diğer Dosyalar */}
              {otherFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Diğer Dosyalar ({otherFiles.length})</h4>
                  <div className="space-y-2">
                    {otherFiles.map((file, idx) => (
                      <a
                        key={idx}
                        href={`${API}${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileIcon className="h-8 w-8 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{file.dosya_adi}</p>
                        </div>
                        <Download className="h-5 w-5 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>EKOS - Ekipman Kontrol Otomasyon Sistemi</p>
          <p className="mt-1">Bu rapor paylaşım bağlantısı ile görüntülenmektedir.</p>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Büyük görüntü"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <XCircle className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicRaporView;
