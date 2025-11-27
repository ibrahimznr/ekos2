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
import { Upload, X, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RaporModal = ({ open, onClose, rapor, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [kategoriler, setKategoriler] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    ekipman_adi: '',
    kategori: '',
    firma: '',
    lokasyon: '',
    marka_model: '',
    seri_no: '',
    alt_kategori: '',
    periyot: '',
    gecerlilik_tarihi: '',
    uygunluk: '',
    aciklama: '',
  });

  useEffect(() => {
    fetchKategoriler();
    if (rapor) {
      setFormData({
        ekipman_adi: rapor.ekipman_adi || '',
        kategori: rapor.kategori || '',
        firma: rapor.firma || '',
        lokasyon: rapor.lokasyon || '',
        marka_model: rapor.marka_model || '',
        seri_no: rapor.seri_no || '',
        alt_kategori: rapor.alt_kategori || '',
        periyot: rapor.periyot || '',
        gecerlilik_tarihi: rapor.gecerlilik_tarihi || '',
        uygunluk: rapor.uygunluk || '',
        aciklama: rapor.aciklama || '',
      });
    }
  }, [rapor]);

  const fetchKategoriler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kategoriler`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKategoriler(response.data);
    } catch (error) {
      toast.error('Kategoriler yüklenemedi');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    
    for (const file of files) {
      // Check file size (4GB)
      if (file.size > 4 * 1024 * 1024 * 1024) {
        toast.error(`${file.name}: Dosya boyutu 4GB'dan büyük olamaz`);
        continue;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Sadece JPG, PNG ve PDF formatları desteklenir`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let raporId = rapor?.id;
      
      if (rapor) {
        // Update
        await axios.put(`${API}/raporlar/${rapor.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Rapor güncellendi');
      } else {
        // Create
        const response = await axios.post(`${API}/raporlar`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        raporId = response.data.id;
        toast.success('Rapor oluşturuldu');
      }
      
      // Upload files if any
      if (selectedFiles.length > 0 && raporId) {
        for (const file of selectedFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          
          try {
            await axios.post(`${API}/upload/${raporId}`, fileFormData, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (fileError) {
            toast.error(`${file.name} yüklenemedi`);
          }
        }
        
        if (selectedFiles.length > 0) {
          toast.success(`${selectedFiles.length} dosya yüklendi`);
        }
      }
      
      onSuccess();
      onClose();
      setSelectedFiles([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Rapor kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="rapor-modal">
        <DialogHeader>
          <DialogTitle>{rapor ? 'Raporu Düzenle' : 'Yeni Rapor Oluştur'}</DialogTitle>
          <DialogDescription>
            Ekipman muayene raporu bilgilerini girin. * işareti zorunlu alanları belirtir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ekipman Adı */}
            <div className="space-y-2">
              <Label htmlFor="ekipman_adi">Ekipman Adı *</Label>
              <Input
                id="ekipman_adi"
                value={formData.ekipman_adi}
                onChange={(e) => handleChange('ekipman_adi', e.target.value)}
                required
                data-testid="ekipman-adi-input"
              />
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori *</Label>
              <Select value={formData.kategori} onValueChange={(value) => handleChange('kategori', value)} required>
                <SelectTrigger data-testid="kategori-select">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriler.map((kat) => (
                    <SelectItem key={kat.id} value={kat.isim}>
                      {kat.isim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Firma */}
            <div className="space-y-2">
              <Label htmlFor="firma">Firma *</Label>
              <Input
                id="firma"
                value={formData.firma}
                onChange={(e) => handleChange('firma', e.target.value)}
                required
                data-testid="firma-input"
              />
            </div>

            {/* Lokasyon */}
            <div className="space-y-2">
              <Label htmlFor="lokasyon">Lokasyon</Label>
              <Input
                id="lokasyon"
                value={formData.lokasyon}
                onChange={(e) => handleChange('lokasyon', e.target.value)}
                data-testid="lokasyon-input"
              />
            </div>

            {/* Marka/Model */}
            <div className="space-y-2">
              <Label htmlFor="marka_model">Marka/Model</Label>
              <Input
                id="marka_model"
                value={formData.marka_model}
                onChange={(e) => handleChange('marka_model', e.target.value)}
                data-testid="marka-model-input"
              />
            </div>

            {/* Seri No */}
            <div className="space-y-2">
              <Label htmlFor="seri_no">Seri No</Label>
              <Input
                id="seri_no"
                value={formData.seri_no}
                onChange={(e) => handleChange('seri_no', e.target.value)}
                data-testid="seri-no-input"
              />
            </div>

            {/* Alt Kategori */}
            <div className="space-y-2">
              <Label htmlFor="alt_kategori">Alt Kategori</Label>
              <Input
                id="alt_kategori"
                value={formData.alt_kategori}
                onChange={(e) => handleChange('alt_kategori', e.target.value)}
                data-testid="alt-kategori-input"
              />
            </div>

            {/* Periyot */}
            <div className="space-y-2">
              <Label htmlFor="periyot">Periyot</Label>
              <Select value={formData.periyot} onValueChange={(value) => handleChange('periyot', value)}>
                <SelectTrigger data-testid="periyot-select">
                  <SelectValue placeholder="Periyot seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 Aylık">3 Aylık</SelectItem>
                  <SelectItem value="6 Aylık">6 Aylık</SelectItem>
                  <SelectItem value="12 Aylık">12 Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Geçerlilik Tarihi */}
            <div className="space-y-2">
              <Label htmlFor="gecerlilik_tarihi">Geçerlilik Tarihi</Label>
              <Input
                id="gecerlilik_tarihi"
                type="date"
                value={formData.gecerlilik_tarihi}
                onChange={(e) => handleChange('gecerlilik_tarihi', e.target.value)}
                data-testid="gecerlilik-tarihi-input"
              />
            </div>

            {/* Uygunluk */}
            <div className="space-y-2">
              <Label htmlFor="uygunluk">Uygunluk Durumu</Label>
              <Select value={formData.uygunluk} onValueChange={(value) => handleChange('uygunluk', value)}>
                <SelectTrigger data-testid="uygunluk-select">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uygun">Uygun</SelectItem>
                  <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="aciklama">Açıklama</Label>
            <Textarea
              id="aciklama"
              value={formData.aciklama}
              onChange={(e) => handleChange('aciklama', e.target.value)}
              rows={3}
              data-testid="aciklama-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-button">
              İptal
            </Button>
            <Button type="submit" disabled={loading} data-testid="submit-button">
              {loading ? 'Kaydediliyor...' : rapor ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RaporModal;