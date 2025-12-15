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
import { Building2 } from 'lucide-react';
import DragDropImageUpload from './DragDropImageUpload';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IskeleBileseniModal = ({ open, onClose, onSuccess, editData = null }) => {
  const [loading, setLoading] = useState(false);
  const [projeler, setProjeler] = useState([]);
  const [bilesenAdlari, setBilesenAdlari] = useState([]);
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
      fetchBilesenAdlari();
      // If editing, populate form with existing data
      if (editData) {
        setFormData({
          proje_id: editData.proje_id || '',
          bileşen_adi: editData.bileşen_adi || '',
          malzeme_kodu: editData.malzeme_kodu || '',
          bileşen_adedi: editData.bileşen_adedi || 1,
          firma_adi: editData.firma_adi || '',
          gecerlilik_tarihi: editData.gecerlilik_tarihi || '',
          uygunluk: editData.uygunluk || 'Uygun',
          aciklama: editData.aciklama || '',
          gorseller: editData.gorseller || []
        });
      } else {
        // Reset form for new entry
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
      }
    }
  }, [open, editData]);

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

  const handleImagesChange = (newImages) => {
    setFormData(prev => ({ ...prev, gorseller: newImages }));
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

      if (editData) {
        // Update existing
        await axios.put(`${API}/iskele-bilesenleri/${editData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('İskele bileşeni başarıyla güncellendi');
      } else {
        // Create new
        await axios.post(`${API}/iskele-bilesenleri`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('İskele bileşeni başarıyla eklendi');
      }

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
      toast.error(error.response?.data?.detail || `İskele bileşeni ${editData ? 'güncellenemedi' : 'eklenemedi'}`);
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
            {editData ? 'İskele Bileşeni Düzenle' : 'İskele Bileşeni Ekle'}
          </DialogTitle>
          <DialogDescription>
            {editData ? 'İskele bileşeni bilgilerini güncelleyin.' : 'Yeni iskele bileşeni ekleyin. Tüm zorunlu alanları doldurun.'}
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

          {/* Görsel Upload - Drag & Drop + Paste */}
          <DragDropImageUpload
            images={formData.gorseller}
            onChange={handleImagesChange}
            maxImages={3}
            label="Bileşen Görselleri"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editData ? 'Güncelleniyor...' : 'Ekleniyor...') : (editData ? 'Güncelle' : 'Ekle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IskeleBileseniModal;
