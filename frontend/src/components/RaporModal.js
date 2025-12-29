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
import DragDropImageUpload from './DragDropImageUpload';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RaporModal = ({ open, onClose, rapor, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [projeler, setProjeler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [altKategoriler, setAltKategoriler] = useState([]);
  const [kategoriAltKategoriMap, setKategoriAltKategoriMap] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]); // base64 for preview
  const [selectedImageFiles, setSelectedImageFiles] = useState([]); // actual File objects
  const [formData, setFormData] = useState({
    proje_id: '',
    sehir: '',
    ekipman_adi: '',
    kategori: '',
    alt_kategori: '',
    firma: '',
    lokasyon: '',
    marka_model: '',
    seri_no: '',
    periyot: '',
    gecerlilik_tarihi: '',
    uygunluk: '',
    aciklama: '',
  });

  useEffect(() => {
    if (open) {
      fetchProjeler();
      fetchSehirler();
      fetchKategoriler();
      fetchKategoriAltKategoriMap();
    }
    if (rapor) {
      setFormData({
        proje_id: rapor.proje_id || '',
        sehir: rapor.sehir || '',
        ekipman_adi: rapor.ekipman_adi || '',
        kategori: rapor.kategori || '',
        alt_kategori: rapor.alt_kategori || '',
        firma: rapor.firma || '',
        lokasyon: rapor.lokasyon || '',
        marka_model: rapor.marka_model || '',
        seri_no: rapor.seri_no || '',
        periyot: rapor.periyot || '',
        gecerlilik_tarihi: rapor.gecerlilik_tarihi || '',
        uygunluk: rapor.uygunluk || '',
        aciklama: rapor.aciklama || '',
      });
      
      // Load alt kategoriler if kategori exists
      if (rapor.kategori && kategoriAltKategoriMap[rapor.kategori]) {
        setAltKategoriler(kategoriAltKategoriMap[rapor.kategori]);
      }
    }
  }, [open, rapor]);

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

  // When project is selected, auto-fill city (lokasyon)
  const handleProjeChange = (projeId) => {
    setFormData(prev => ({ ...prev, proje_id: projeId }));
    
    // Find selected project and auto-fill city
    const selectedProje = projeler.find(p => p.id === projeId);
    if (selectedProje && selectedProje.lokasyon) {
      // Try to match project location with city list
      const matchingCity = sehirler.find(s => 
        s.isim.toLowerCase().includes(selectedProje.lokasyon.toLowerCase()) ||
        selectedProje.lokasyon.toLowerCase().includes(s.isim.toLowerCase())
      );
      
      if (matchingCity) {
        setFormData(prev => ({ ...prev, proje_id: projeId, sehir: matchingCity.isim }));
        toast.success(`Şehir otomatik dolduruldu: ${matchingCity.isim}`);
      } else {
        setFormData(prev => ({ ...prev, proje_id: projeId }));
      }
    }
  };

  const fetchSehirler = async () => {
    try {
      const response = await axios.get(`${API}/sehirler`);
      setSehirler(response.data);
    } catch (error) {
      toast.error('Şehirler yüklenemedi');
    }
  };

  const fetchKategoriler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kategoriler`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Get unique kategoriler by isim
      const uniqueKategoriler = [];
      const seenNames = new Set();
      
      response.data.forEach(kat => {
        if (!seenNames.has(kat.isim)) {
          seenNames.add(kat.isim);
          uniqueKategoriler.push(kat);
        }
      });
      
      setKategoriler(uniqueKategoriler);
      
      // Build category-subcategory map from kategoriler data
      const categoryMap = {};
      response.data.forEach(kategori => {
        if (kategori.alt_kategoriler && kategori.alt_kategoriler.length > 0) {
          categoryMap[kategori.isim] = kategori.alt_kategoriler;
        }
      });
      setKategoriAltKategoriMap(categoryMap);
    } catch (error) {
      toast.error('Kategoriler yüklenemedi');
    }
  };

  const fetchKategoriAltKategoriMap = async () => {
    // This is now handled in fetchKategoriler
    // Keep for backward compatibility
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kategori-alt-kategoriler`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Merge with existing map
      setKategoriAltKategoriMap(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.log('Kategori-alt kategori map API not available, using kategoriler data');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    
    for (const file of files) {
      if (file.size > 4 * 1024 * 1024 * 1024) {
        toast.error(`${file.name}: Dosya boyutu 4GB'dan büyük olamaz`);
        continue;
      }
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Sadece PDF, DOC ve DOCX formatları desteklenir`);
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
      
      // Upload images if any
      if (selectedImageFiles.length > 0 && raporId) {
        for (const image of selectedImageFiles) {
          const imageFormData = new FormData();
          imageFormData.append('file', image);
          
          try {
            await axios.post(`${API}/upload/${raporId}`, imageFormData, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (imageError) {
            toast.error(`${image.name} yüklenemedi`);
          }
        }
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
      }
      
      const totalUploaded = selectedImages.length + selectedFiles.length;
      if (totalUploaded > 0) {
        toast.success(`${totalUploaded} dosya yüklendi`);
      }
      
      onSuccess();
      onClose();
      setSelectedFiles([]);
      setSelectedImages([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Rapor kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // When kategori changes, update alt kategoriler
    if (field === 'kategori') {
      const altKats = kategoriAltKategoriMap[value] || [];
      setAltKategoriler(altKats);
      setFormData({ ...formData, kategori: value, alt_kategori: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="rapor-modal">
        <DialogHeader>
          <DialogTitle>{rapor ? 'Raporu Düzenle' : 'Yeni Rapor Oluştur'}</DialogTitle>
          <DialogDescription>
            Ekipman muayene raporu bilgilerini girin. * işareti zorunlu alanları belirtir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Proje */}
            <div className="space-y-2">
              <Label htmlFor="proje_id">Proje *</Label>
              <Select value={formData.proje_id} onValueChange={handleProjeChange} required>
                <SelectTrigger data-testid="proje-select">
                  <SelectValue placeholder="Proje seçin" />
                </SelectTrigger>
                <SelectContent>
                  {projeler.map((proje) => (
                    <SelectItem key={proje.id} value={proje.id}>
                      {proje.proje_adi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Şehir */}
            <div className="space-y-2">
              <Label htmlFor="sehir">Şehir *</Label>
              <Select value={formData.sehir} onValueChange={(value) => handleChange('sehir', value)} required>
                <SelectTrigger data-testid="sehir-select">
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {sehirler.map((sehir) => (
                    <SelectItem key={sehir.kod} value={sehir.isim}>
                      {sehir.isim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Alt Kategori */}
            <div className="space-y-2">
              <Label htmlFor="alt_kategori">Alt Kategori</Label>
              <Select 
                value={formData.alt_kategori} 
                onValueChange={(value) => handleChange('alt_kategori', value)}
                disabled={!formData.kategori || altKategoriler.length === 0}
              >
                <SelectTrigger data-testid="alt-kategori-select">
                  <SelectValue placeholder={formData.kategori ? "Alt kategori seçin" : "Önce kategori seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {altKategoriler.map((altKat, index) => (
                    <SelectItem key={index} value={altKat}>
                      {altKat}
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

          {/* Medya Dosyaları */}
          {!rapor && (
            <div className="space-y-6 border-t pt-4">
              {/* Görseller - Drag & Drop + Paste */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Rapor Görselleri</Label>
                <DragDropImageUpload
                  images={selectedImages}
                  onChange={setSelectedImages}
                  maxImages={5}
                  label="Görseller"
                />
              </div>

              {/* Diğer Dosyalar (PDF vb) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Diğer Dosyalar (PDF vb)</Label>
                  <div>
                    <input
                      type="file"
                      id="rapor-file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      multiple
                      data-testid="rapor-file-input"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById('rapor-file-upload').click()}
                      data-testid="add-file-button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Dosya Ekle
                    </Button>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        data-testid={`selected-file-${index}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`remove-file-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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