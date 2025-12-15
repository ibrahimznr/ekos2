import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, Hash, Calendar, CheckCircle, XCircle, FileText } from 'lucide-react';

const IskeleBileseniOnizlemeModal = ({ open, onClose, bilesen }) => {
  if (!bilesen) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            <Package className="h-6 w-6" />
            İskele Bileşeni Detayları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bileşen Adı */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-700" />
              <span className="text-sm font-medium text-gray-600">Bileşen Adı</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{bilesen.bileşen_adi}</p>
          </div>

          {/* Grid: Malzeme Kodu ve Adet */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Malzeme Kodu</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{bilesen.malzeme_kodu}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Bileşen Adedi</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{bilesen.bileşen_adedi}</p>
            </div>
          </div>

          {/* Grid: Firma ve Proje */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Firma Adı</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{bilesen.firma_adi}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Proje Adı</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{bilesen.proje_adi || '-'}</p>
            </div>
          </div>

          {/* Geçerlilik Tarihi ve Uygunluk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Geçerlilik Tarihi</span>
              </div>
              <p className="text-base font-semibold text-gray-900">
                {bilesen.gecerlilik_tarihi || 'Belirtilmemiş'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {bilesen.uygunluk === 'Uygun' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-600">Uygunluk</span>
              </div>
              <Badge
                className={`${
                  bilesen.uygunluk === 'Uygun'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {bilesen.uygunluk}
              </Badge>
            </div>
          </div>

          {/* Açıklama */}
          {bilesen.aciklama && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Açıklama / Not</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{bilesen.aciklama}</p>
            </div>
          )}

          {/* Görseller */}
          {bilesen.gorseller && bilesen.gorseller.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">
                  Görseller ({bilesen.gorseller.length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bilesen.gorseller.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Bileşen görseli ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(img, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Büyüt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              {bilesen.created_by_username && (
                <div>
                  <span className="font-medium">Oluşturan:</span> {bilesen.created_by_username}
                </div>
              )}
              {bilesen.created_at && (
                <div>
                  <span className="font-medium">Oluşturulma:</span>{' '}
                  {new Date(bilesen.created_at).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IskeleBileseniOnizlemeModal;
