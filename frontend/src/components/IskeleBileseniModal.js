import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { toast } from 'sonner';
import { Building2, X, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IskeleBileseniModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [projeler, setProjeler] = useState([]);
  const [formData, setFormData] = useState({
    proje_id: '',
    bileşen_adi: '',
    malzeme_kodu: '',
    bileşen_adedi: 1,
    firma_adi: '',
    gecerlilik_tarihi: '',
    uygunluk: 'Uygun',
    aciklama: '',
    gorseller: []
  });

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.gorseller.length + files.length > 3) {
      toast.error('Maksimum 3 görsel yükleyebilirsiniz');
      return;
    }

    // Convert to base64 for preview (in production, upload to server)
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          gorseller: [...prev.gorseller, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gorseller: prev.gorseller.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.proje_id) {
      toast.error('Lütfen bir proje seçin');
      return;
    }

    if (!formData.bileşen_adi || !formData.malzeme_kodu || !formData.firma_adi) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (formData.bileşen_adedi < 1) {
      toast.error('Bileşen adedi en az 1 olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        ...formData,
        bileşen_adedi: parseInt(formData.bileşen_adedi)
      };

      await axios.post(`${API}/iskele-bilesenleri`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('İskele bileşeni başarıyla eklendi');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        proje_id: '',
        bileşen_adi: '',
        malzeme_kodu: '',
        bileşen_adedi: 1,
        firma_adi: '',
        gecerlilik_tarihi: '',
        uygunluk: 'Uygun',
        aciklama: '',
        gorseller: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İskele bileşeni eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            İskele Bileşeni Ekle
          </DialogTitle>
          <DialogDescription>
            Yeni iskele bileşeni ekleyin. Tüm zorunlu alanları doldurun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proje Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="proje">
              Proje <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.proje_id} onValueChange={(value) => handleChange('proje_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Bileşenin bağlı olacağı projeyi seçin" />
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

          {/* Bileşen Adı */}
          <div className="space-y-2">
            <Label htmlFor="bilesen-adi">
              Bileşen Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bilesen-adi"
              value={formData.bileşen_adi}
              onChange={(e) => handleChange('bileşen_adi', e.target.value)}
              placeholder="Örn: Çelik Direk, Bağlantı Elemanı"
              required
            />
          </div>

          {/* Malzeme Kodu ve Bileşen Adedi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="malzeme-kodu">
                Malzeme Kodu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="malzeme-kodu"
                value={formData.malzeme_kodu}
                onChange={(e) => handleChange('malzeme_kodu', e.target.value)}
                placeholder="Örn: ISK-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bilesen-adedi">
                Bileşen Adedi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bilesen-adedi"
                type="number"
                min="1"
                value={formData.bileşen_adedi}
                onChange={(e) => handleChange('bileşen_adedi', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Firma Adı */}
          <div className="space-y-2">
            <Label htmlFor="firma-adi">
              Firma Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firma-adi"
              value={formData.firma_adi}
              onChange={(e) => handleChange('firma_adi', e.target.value)}
              placeholder="Firma adını girin"
              required
            />
          </div>

          {/* Periyot ve Geçerlilik Tarihi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periyot">İskele Periyodu</Label>
              <Input
                id="periyot"
                value="6 Aylık"
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">İskele periyodu her zaman 6 aylıktır</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gecerlilik-tarihi">Geçerlilik Tarihi</Label>
              <Input
                id="gecerlilik-tarihi"
                type="date"
                value={formData.gecerlilik_tarihi}
                onChange={(e) => handleChange('gecerlilik_tarihi', e.target.value)}
              />
            </div>
          </div>

          {/* Uygunluk */}
          <div className="space-y-2">
            <Label htmlFor="uygunluk">Uygunluk</Label>
            <Select value={formData.uygunluk} onValueChange={(value) => handleChange('uygunluk', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Uygunluk seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Uygun">Uygun</SelectItem>
                <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="aciklama">Açıklama / Not</Label>
            <Textarea
              id="aciklama"
              value={formData.aciklama}
              onChange={(e) => handleChange('aciklama', e.target.value)}
              placeholder="Ek bilgi veya notlar yazın..."
              rows={3}
            />
          </div>

          {/* Görsel Upload */}
          <div className="space-y-2">
            <Label>Bileşen Görselleri (Maksimum 3 adet)</Label>
            
            {/* Image Preview */}
            {formData.gorseller.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {formData.gorseller.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Görsel ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {formData.gorseller.length < 3 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Görsel yüklemek için tıklayın
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.gorseller.length}/3 görsel yüklendi
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IskeleBileseniModal;
