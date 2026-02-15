import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { downloadExcel } from '@/utils/fileDownload';
import { Plus, Trash2, Users, FolderTree, Shield, AlertCircle, FolderKanban, X, Eye, EyeOff, Gauge, ChevronRight, ArrowLeft, Building2, FileText, Save, Download, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [projeler, setProjeler] = useState([]);
  const [iskeleBilesenAdlari, setIskeleBilesenAdlari] = useState([]);
  const [kalibrasyonCihazlari, setKalibrasyonCihazlari] = useState([]);
  const [activeSection, setActiveSection] = useState(null); // null = show cards, 'users' | 'kategoriler' | 'projeler' | 'bilesen-adlari' | 'kalibrasyon' | 'sozlesme' = show section
  const [userAgreement, setUserAgreement] = useState('');
  const [agreementSaving, setAgreementSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showKategoriDialog, setShowKategoriDialog] = useState(false);
  const [showProjeDialog, setShowProjeDialog] = useState(false);
  const [showBilesenAdiDialog, setShowBilesenAdiDialog] = useState(false);
  const [showKalibrasyonDialog, setShowKalibrasyonDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'user', 'kategori', 'proje', or 'kalibrasyon'

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState(''); // 'user', 'kategori', 'proje', or 'kalibrasyon'

  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', password_confirm: '', role: 'viewer' });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [newKategori, setNewKategori] = useState({ isim: '', aciklama: '', alt_kategoriler: [] });
  const [altKategoriInput, setAltKategoriInput] = useState('');
  const [newProje, setNewProje] = useState({
    proje_adi: '',
    firma_adi: '',
    proje_kodu: '',
    lokasyon: '',
    baslangic_tarihi: '',
    bitis_tarihi: '',
    durum: 'Aktif',
    aciklama: ''
  });
  const [newBilesenAdi, setNewBilesenAdi] = useState({ bilesen_adi: '', aciklama: '' });
  const [newKalibrasyon, setNewKalibrasyon] = useState({ cihaz_adi: '', seri_no: '', kalibrasyon_tarihi: '' });

  // Bulk delete state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedKategoriler, setSelectedKategoriler] = useState([]);
  const [selectedProjeler, setSelectedProjeler] = useState([]);
  const [selectedBilesenAdlari, setSelectedBilesenAdlari] = useState([]);
  const [selectedKalibrasyonlar, setSelectedKalibrasyonlar] = useState([]);

  // Kategori Excel Import state
  const [showKategoriImportDialog, setShowKategoriImportDialog] = useState(false);
  const [kategoriImportFile, setKategoriImportFile] = useState(null);
  const [kategoriImporting, setKategoriImporting] = useState(false);

  // Admin Message state
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [allUsersForMessage, setAllUsersForMessage] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role !== 'admin') {
        toast.error('Bu sayfaya erişim yetkiniz yok');
        navigate('/');
        return;
      }
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchKategoriler(), fetchProjeler(), fetchIskeleBilesenAdlari(), fetchKalibrasyonCihazlari(), fetchUserAgreement()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Kullanıcılar yüklenemedi');
    }
  };

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

  const fetchIskeleBilesenAdlari = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/iskele-bilesen-adlari`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIskeleBilesenAdlari(response.data);
    } catch (error) {
      toast.error('İskele bileşen adları yüklenemedi');
    }
  };

  const fetchKalibrasyonCihazlari = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kalibrasyon`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKalibrasyonCihazlari(response.data);
    } catch (error) {
      console.error('Kalibrasyon cihazları yüklenemedi');
    }
  };

  const fetchUserAgreement = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ayarlar/kullanici-sozlesmesi`);
      setUserAgreement(response.data.content || '');
    } catch (error) {
      console.error('Kullanıcı sözleşmesi yüklenemedi');
    }
  };

  const saveUserAgreement = async () => {
    try {
      setAgreementSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`${BACKEND_URL}/api/ayarlar/kullanici-sozlesmesi`,
        { content: userAgreement },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Kullanıcı sözleşmesi kaydedildi');
    } catch (error) {
      toast.error('Kullanıcı sözleşmesi kaydedilemedi');
    } finally {
      setAgreementSaving(false);
    }
  };

  const handleCreateKalibrasyon = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!newKalibrasyon.cihaz_adi || !newKalibrasyon.seri_no || !newKalibrasyon.kalibrasyon_tarihi) {
        toast.error('Tüm alanları doldurun');
        return;
      }

      if (editMode && editingItem) {
        await axios.put(`${API}/kalibrasyon/${editingItem.id}`, newKalibrasyon, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kalibrasyon cihazı güncellendi');
      } else {
        await axios.post(`${API}/kalibrasyon`, newKalibrasyon, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kalibrasyon cihazı eklendi');
      }

      handleCloseDialog('kalibrasyon');
      fetchKalibrasyonCihazlari();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDeleteKalibrasyon = async (cihazId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/kalibrasyon/${cihazId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Kalibrasyon cihazı silindi');
      fetchKalibrasyonCihazlari();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');

      if (editMode && editingItem) {
        // Update existing user
        const updateData = {
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        };

        // Only include password if it's provided
        if (newUser.password) {
          updateData.password = newUser.password;
          updateData.password_confirm = newUser.password_confirm;
        }

        await axios.put(`${API}/users/${editingItem.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kullanıcı güncellendi');
      } else {
        // Create new user via admin endpoint
        await axios.post(`${API}/users`, newUser, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kullanıcı oluşturuldu');
      }

      handleCloseDialog('user');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editMode ? 'Kullanıcı güncellenemedi' : 'Kullanıcı oluşturulamadı'));
    }
  };

  const handleCreateKategori = async () => {
    try {
      const token = localStorage.getItem('token');

      if (editMode && editingItem) {
        // Update existing
        await axios.put(`${API}/kategoriler/${editingItem.id}`, newKategori, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kategori güncellendi');
      } else {
        // Create new
        await axios.post(`${API}/kategoriler`, newKategori, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kategori oluşturuldu');
      }

      handleCloseDialog('kategori');
      fetchKategoriler();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editMode ? 'Kategori güncellenemedi' : 'Kategori oluşturulamadı'));
    }
  };

  // Kategori Excel şablonu indir
  const handleDownloadKategoriTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kategoriler/excel/template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const saved = await downloadExcel(new Blob([response.data]), 'kategori_sablonu.xlsx');
      if (saved) {
        toast.success('Şablon indirildi');
      }
    } catch (error) {
      toast.error('Şablon indirilemedi');
    }
  };

  // Kategori Excel import
  const handleKategoriImport = async () => {
    if (!kategoriImportFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    setKategoriImporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', kategoriImportFile);

      const response = await axios.post(`${API}/kategoriler/excel/import`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const { imported_count, skipped_count, errors } = response.data;
      
      if (imported_count > 0) {
        toast.success(`${imported_count} kategori başarıyla eklendi`);
      }
      if (skipped_count > 0) {
        toast.info(`${skipped_count} kategori zaten mevcut (atlandı)`);
      }
      if (errors && errors.length > 0) {
        toast.warning(`${errors.length} satırda hata oluştu`);
      }

      setShowKategoriImportDialog(false);
      setKategoriImportFile(null);
      fetchKategoriler();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Import başarısız');
    } finally {
      setKategoriImporting(false);
    }
  };

  // Fetch users for message dialog
  const fetchUsersForMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications/users-for-message`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsersForMessage(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Open message dialog
  const handleOpenMessageDialog = () => {
    fetchUsersForMessage();
    setShowMessageDialog(true);
  };

  // Toggle recipient selection
  const toggleRecipient = (userId) => {
    setSelectedRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select/Deselect all recipients
  const toggleAllRecipients = () => {
    if (selectedRecipients.length === allUsersForMessage.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(allUsersForMessage.map(u => u.id));
    }
  };

  // Send admin message
  const handleSendAdminMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Lütfen bir mesaj yazın');
      return;
    }
    if (selectedRecipients.length === 0) {
      toast.error('Lütfen en az bir alıcı seçin');
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/notifications/admin-message`, {
        title: messageTitle || 'Yönetimden Mesaj',
        message: messageContent,
        recipient_ids: selectedRecipients
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${selectedRecipients.length} kullanıcıya mesaj gönderildi`);
      setShowMessageDialog(false);
      setMessageTitle('');
      setMessageContent('');
      setSelectedRecipients([]);
    } catch (error) {
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateProje = async () => {
    try {
      const token = localStorage.getItem('token');

      if (editMode && editingItem) {
        // Update existing
        await axios.put(`${API}/projeler/${editingItem.id}`, newProje, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Proje güncellendi');
      } else {
        // Create new
        await axios.post(`${API}/projeler`, newProje, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Proje oluşturuldu');
      }

      handleCloseDialog('proje');
      fetchProjeler();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editMode ? 'Proje güncellenemedi' : 'Proje oluşturulamadı'));
    }
  };

  const handleCreateBilesenAdi = async () => {
    try {
      const token = localStorage.getItem('token');

      if (editMode && editingItem) {
        // Update existing
        await axios.put(
          `${API}/iskele-bilesen-adlari/${editingItem.id}`,
          null,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              bilesen_adi: newBilesenAdi.bilesen_adi,
              aciklama: newBilesenAdi.aciklama || null
            }
          }
        );
        toast.success('Bileşen adı güncellendi');
      } else {
        // Create new
        await axios.post(
          `${API}/iskele-bilesen-adlari`,
          null,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              bilesen_adi: newBilesenAdi.bilesen_adi,
              aciklama: newBilesenAdi.aciklama || null
            }
          }
        );
        toast.success('Bileşen adı oluşturuldu');
      }

      handleCloseDialog('bilesen_adi');
      fetchIskeleBilesenAdlari();
    } catch (error) {
      toast.error(error.response?.data?.detail || (editMode ? 'Bileşen adı güncellenemedi' : 'Bileşen adı oluşturulamadı'));
    }
  };

  const handleDeleteClick = (item, type) => {
    setDeleteItem(item);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');

      if (deleteType === 'user') {
        await axios.delete(`${API}/users/${deleteItem.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kullanıcı silindi');
        fetchUsers();
      } else if (deleteType === 'kategori') {
        await axios.delete(`${API}/kategoriler/${deleteItem.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Kategori silindi');
        fetchKategoriler();
      } else if (deleteType === 'proje') {
        await axios.delete(`${API}/projeler/${deleteItem.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Proje silindi');
        fetchProjeler();
      } else if (deleteType === 'bilesen_adi') {
        await axios.delete(`${API}/iskele-bilesen-adlari/${deleteItem.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Bileşen adı silindi');
        fetchIskeleBilesenAdlari();
      }

      setShowDeleteDialog(false);
      setDeleteItem(null);
      setDeleteType('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const handleBulkDelete = async (type) => {
    const token = localStorage.getItem('token');
    let ids = [];
    let endpoint = '';

    if (type === 'user') {
      ids = selectedUsers;
      endpoint = `${API}/users/bulk-delete`;
    } else if (type === 'kategori') {
      ids = selectedKategoriler;
      endpoint = `${API}/kategoriler/bulk-delete`;
    } else if (type === 'proje') {
      ids = selectedProjeler;
      endpoint = `${API}/projeler/bulk-delete`;
    }

    if (ids.length === 0) {
      toast.error('Lütfen silmek için en az bir öğe seçin');
      return;
    }

    try {
      const response = await axios.post(endpoint, ids, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message);

      if (type === 'user') {
        setSelectedUsers([]);
        fetchUsers();
      } else if (type === 'kategori') {
        setSelectedKategoriler([]);
        fetchKategoriler();
      } else if (type === 'proje') {
        setSelectedProjeler([]);
        fetchProjeler();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Toplu silme işlemi başarısız');
    }
  };

  const handleSelectAll = (type) => {
    if (type === 'user') {
      if (selectedUsers.length === users.filter(u => u.id !== user?.id).length) {
        setSelectedUsers([]);
      } else {
        setSelectedUsers(users.filter(u => u.id !== user?.id).map(u => u.id));
      }
    } else if (type === 'kategori') {
      if (selectedKategoriler.length === kategoriler.length) {
        setSelectedKategoriler([]);
      } else {
        setSelectedKategoriler(kategoriler.map(k => k.id));
      }
    } else if (type === 'proje') {
      if (selectedProjeler.length === projeler.length) {
        setSelectedProjeler([]);
      } else {
        setSelectedProjeler(projeler.map(p => p.id));
      }
    }
  };

  const handleToggleSelect = (id, type) => {
    if (type === 'user') {
      setSelectedUsers(prev =>
        prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
      );
    } else if (type === 'kategori') {
      setSelectedKategoriler(prev =>
        prev.includes(id) ? prev.filter(kid => kid !== id) : [...prev, id]
      );
    } else if (type === 'proje') {
      setSelectedProjeler(prev =>
        prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
      );
    }
  };

  // Edit handlers
  const handleEditClick = (item, type) => {
    setEditingItem(item);
    setEditType(type);
    setEditMode(true);

    if (type === 'user') {
      setNewUser({
        username: item.username || '',
        email: item.email || '',
        password: '',
        password_confirm: '',
        role: item.role || 'viewer'
      });
      setShowUserDialog(true);
    } else if (type === 'kategori') {
      setNewKategori({
        isim: item.isim || '',
        aciklama: item.aciklama || '',
        alt_kategoriler: item.alt_kategoriler || []
      });
      setShowKategoriDialog(true);
    } else if (type === 'proje') {
      setNewProje({
        proje_adi: item.proje_adi || '',
        firma_adi: item.firma_adi || '',
        proje_kodu: item.proje_kodu || '',
        lokasyon: item.lokasyon || '',
        baslangic_tarihi: item.baslangic_tarihi || '',
        bitis_tarihi: item.bitis_tarihi || '',
        durum: item.durum || 'Aktif',
        aciklama: item.aciklama || ''
      });
      setShowProjeDialog(true);
    } else if (type === 'bilesen_adi') {
      setNewBilesenAdi({
        bilesen_adi: item.bilesen_adi || '',
        aciklama: item.aciklama || ''
      });
      setShowBilesenAdiDialog(true);
    } else if (type === 'kalibrasyon') {
      setNewKalibrasyon({
        cihaz_adi: item.cihaz_adi || '',
        seri_no: item.seri_no || '',
        kalibrasyon_tarihi: item.kalibrasyon_tarihi || ''
      });
      setShowKalibrasyonDialog(true);
    }
  };

  const handleCloseDialog = (type) => {
    setEditMode(false);
    setEditingItem(null);
    setEditType('');

    if (type === 'user') {
      setShowUserDialog(false);
      setNewUser({ username: '', email: '', password: '', password_confirm: '', role: 'viewer' });
      setShowPassword(false);
      setShowPasswordConfirm(false);
    } else if (type === 'kategori') {
      setShowKategoriDialog(false);
      setNewKategori({ isim: '', aciklama: '', alt_kategoriler: [] });
      setAltKategoriInput('');
    } else if (type === 'proje') {
      setShowProjeDialog(false);
      setNewProje({ proje_adi: '', firma_adi: '', proje_kodu: '', lokasyon: '', baslangic_tarihi: '', bitis_tarihi: '', durum: 'Aktif', aciklama: '' });
    } else if (type === 'bilesen_adi') {
      setShowBilesenAdiDialog(false);
      setNewBilesenAdi({ bilesen_adi: '', aciklama: '' });
    } else if (type === 'kalibrasyon') {
      setShowKalibrasyonDialog(false);
      setNewKalibrasyon({ cihaz_adi: '', seri_no: '', kalibrasyon_tarihi: '' });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inspector':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Yönetici';
      case 'inspector':
        return 'Müfettiş';
      default:
        return 'Görüntüleyici';
    }
  };

  // Excel Export Function
  const exportUsersToExcel = () => {
    if (users.length === 0) {
      toast.error('Dışa aktarılacak kullanıcı bulunamadı');
      return;
    }

    // Prepare data for Excel
    const excelData = users.map(u => ({
      'Kullanıcı Adı': u.username || '',
      'Email': u.email || '',
      'Ad': u.ad || '',
      'Soyad': u.soyad || '',
      'Telefon': u.telefon || '',
      'Şehir': u.sehir || '',
      'Doğum Tarihi': u.dogum_tarihi || '',
      'Firma': u.firma_adi || '',
      'Rol': getRoleLabel(u.role),
      'Email Doğrulandı': u.email_verified ? 'Evet' : 'Hayır',
      'Kayıt Tarihi': u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Kullanıcı Adı
      { wch: 25 }, // Email
      { wch: 12 }, // Ad
      { wch: 12 }, // Soyad
      { wch: 15 }, // Telefon
      { wch: 12 }, // Şehir
      { wch: 12 }, // Doğum Tarihi
      { wch: 15 }, // Firma
      { wch: 12 }, // Rol
      { wch: 15 }, // Email Doğrulandı
      { wch: 12 }, // Kayıt Tarihi
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Kullanıcılar');

    // Generate file and download
    XLSX.writeFile(wb, `kullanicilar_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.success('Kullanıcı listesi Excel formatında indirildi');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {activeSection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-700" />
                Yönetim Paneli
              </h1>
              <p className="text-sm text-gray-600">
                {activeSection ? (
                  activeSection === 'users' ? 'Kullanıcı Yönetimi' :
                    activeSection === 'kategoriler' ? 'Kategori Yönetimi' :
                      activeSection === 'projeler' ? 'Proje Yönetimi' :
                        activeSection === 'bilesen-adlari' ? 'İskele Bileşen Adları Yönetimi' :
                          'Kalibrasyon Cihazları Yönetimi'
                ) : 'Sistem ayarlarını ve verileri yönetin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Cards - Show when no section is active */}
        {!activeSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Kullanıcılar Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 hover:border-l-purple-600"
              onClick={() => setActiveSection('users')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Kullanıcılar</h3>
                      <p className="text-sm text-gray-500">{users.length} kullanıcı</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Projeler Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500 hover:border-l-indigo-600"
              onClick={() => setActiveSection('projeler')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <FolderKanban className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Projeler</h3>
                      <p className="text-sm text-gray-500">{projeler.length} proje</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Kategoriler Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 hover:border-l-green-600"
              onClick={() => setActiveSection('kategoriler')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                      <FolderTree className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Kategoriler</h3>
                      <p className="text-sm text-gray-500">{kategoriler.length} kategori</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* İskele Bileşen Adları Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-teal-500 hover:border-l-teal-600"
              onClick={() => setActiveSection('bilesen-adlari')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">İskele Bileşen Adları</h3>
                      <p className="text-sm text-gray-500">{iskeleBilesenAdlari.length} bileşen</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Kalibrasyon Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-cyan-500 hover:border-l-cyan-600"
              onClick={() => setActiveSection('kalibrasyon')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                      <Gauge className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Kalibrasyon</h3>
                      <p className="text-sm text-gray-500">{kalibrasyonCihazlari.length} cihaz</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Kullanıcı Sözleşmesi Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-500 hover:border-l-amber-600"
              onClick={() => setActiveSection('sozlesme')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Kullanıcı Sözleşmesi</h3>
                      <p className="text-sm text-gray-500">Kayıt sözleşmesi</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Kullanıcı Sözleşmesi Section */}
        {activeSection === 'sozlesme' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Sözleşmesi</h2>
                    <p className="text-sm text-gray-500">Yeni kayıt olan kullanıcılara gösterilecek sözleşme metni</p>
                  </div>
                  <Button
                    onClick={saveUserAgreement}
                    disabled={agreementSaving}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {agreementSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
                <Textarea
                  value={userAgreement}
                  onChange={(e) => setUserAgreement(e.target.value)}
                  placeholder="Kullanıcı sözleşmesi metnini buraya yazın..."
                  className="min-h-[400px] font-mono text-sm"
                  data-testid="user-agreement-textarea"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Markdown formatını destekler. Başlıklar için # kullanabilirsiniz.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedUsers.length === users.filter(u => u.id !== user?.id).length && users.length > 1}
                  onCheckedChange={() => handleSelectAll('user')}
                />
                <p className="text-gray-600">{users.length} kullanıcı {selectedUsers.length > 0 && `(${selectedUsers.length} seçili)`}</p>
              </div>
              <div className="flex gap-2">
                {selectedUsers.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => handleBulkDelete('user')}
                    data-testid="bulk-delete-users-button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Seçilenleri Sil ({selectedUsers.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={exportUsersToExcel}
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  data-testid="export-users-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel İndir
                </Button>
                <Button
                  onClick={() => setShowUserDialog(true)}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                  data-testid="create-user-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kullanıcı
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <Card key={u.id} className="card-hover shadow-md" data-testid={`user-card-${u.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      {u.id !== user?.id && (
                        <Checkbox
                          checked={selectedUsers.includes(u.id)}
                          onCheckedChange={() => handleToggleSelect(u.id, 'user')}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {u.ad || u.soyad ? `${u.ad || ''} ${u.soyad || ''}`.trim() : `@${u.username}`}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1">@{u.username}</p>
                            <p className="text-xs text-gray-500 mb-2">{u.email}</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(u.role)}`}>
                              {getRoleLabel(u.role)}
                            </span>
                          </div>
                          {u.id !== user?.id && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(u, 'user')}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <span className="text-xs">Düzenle</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(u, 'user')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`delete-user-${u.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Profile Info */}
                        <div className="space-y-1 text-xs text-gray-500">
                          {u.firma_adi && (
                            <p><span className="font-medium">Firma:</span> {u.firma_adi}</p>
                          )}
                          {u.telefon && (
                            <p><span className="font-medium">Telefon:</span> {u.telefon}</p>
                          )}
                          {u.sehir && (
                            <p><span className="font-medium">Şehir:</span> {u.sehir}</p>
                          )}
                          {u.dogum_tarihi && (
                            <p><span className="font-medium">Doğum:</span> {new Date(u.dogum_tarihi).toLocaleDateString('tr-TR')}</p>
                          )}
                          <p><span className="font-medium">Kayıt:</span> {new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Kategoriler Section */}
        {activeSection === 'kategoriler' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedKategoriler.length === kategoriler.length && kategoriler.length > 0}
                  onCheckedChange={() => handleSelectAll('kategori')}
                />
                <p className="text-gray-600">{kategoriler.length} kategori {selectedKategoriler.length > 0 && `(${selectedKategoriler.length} seçili)`}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedKategoriler.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => handleBulkDelete('kategori')}
                    data-testid="bulk-delete-categories-button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Seçilenleri Sil ({selectedKategoriler.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDownloadKategoriTemplate}
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  data-testid="download-category-template-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Şablon İndir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowKategoriImportDialog(true)}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  data-testid="import-categories-button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Excel Import
                </Button>
                <Button
                  onClick={() => setShowKategoriDialog(true)}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                  data-testid="create-category-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kategori
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kategoriler.map((kat) => (
                <Card key={kat.id} className="card-hover shadow-md" data-testid={`category-card-${kat.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedKategoriler.includes(kat.id)}
                        onCheckedChange={() => handleToggleSelect(kat.id, 'kategori')}
                        className="mt-1"
                      />
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleEditClick(kat, 'kategori')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2 hover:text-blue-600">{kat.isim}</h3>
                            {kat.aciklama && (
                              <p className="text-sm text-gray-600 mb-2">{kat.aciklama}</p>
                            )}
                            {kat.alt_kategoriler && kat.alt_kategoriler.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Alt Kategoriler:</p>
                                <div className="flex flex-wrap gap-1">
                                  {kat.alt_kategoriler.map((altKat, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                                    >
                                      {altKat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(kat, 'kategori');
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <span className="text-xs">Düzenle</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(kat, 'kategori');
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`delete-category-${kat.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Projeler Section */}
        {activeSection === 'projeler' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedProjeler.length === projeler.length && projeler.length > 0}
                  onCheckedChange={() => handleSelectAll('proje')}
                />
                <p className="text-gray-600">{projeler.length} proje {selectedProjeler.length > 0 && `(${selectedProjeler.length} seçili)`}</p>
              </div>
              <div className="flex gap-2">
                {selectedProjeler.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => handleBulkDelete('proje')}
                    data-testid="bulk-delete-projects-button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Seçilenleri Sil ({selectedProjeler.length})
                  </Button>
                )}
                <Button
                  onClick={() => setShowProjeDialog(true)}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                  data-testid="create-project-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Proje
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projeler.map((proje) => (
                <Card key={proje.id} className="card-hover shadow-md" data-testid={`project-card-${proje.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedProjeler.includes(proje.id)}
                        onCheckedChange={() => handleToggleSelect(proje.id, 'proje')}
                        className="mt-1"
                      />
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleEditClick(proje, 'proje')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1 hover:text-blue-600">{proje.proje_adi}</h3>
                            {proje.firma_adi && (
                              <p className="text-sm text-indigo-600 font-medium mb-2">🏢 {proje.firma_adi}</p>
                            )}
                            {proje.proje_kodu && (
                              <p className="text-xs text-blue-600 mb-1 font-mono">{proje.proje_kodu}</p>
                            )}
                            {proje.durum && (
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${proje.durum === 'Aktif' ? 'bg-green-100 text-green-800' :
                                proje.durum === 'Tamamlandı' ? 'bg-blue-100 text-blue-800' :
                                  proje.durum === 'Askıda' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {proje.durum}
                              </span>
                            )}
                            {proje.lokasyon && (
                              <p className="text-xs text-gray-500 mb-1">📍 {proje.lokasyon}</p>
                            )}
                            {proje.aciklama && (
                              <p className="text-sm text-gray-600 mb-2">{proje.aciklama}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(proje.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(proje, 'proje');
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <span className="text-xs">Düzenle</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(proje, 'proje');
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`delete-project-${proje.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* İskele Bileşen Adları Section */}
        {activeSection === 'bilesen-adlari' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">İskele Bileşen Adları</h2>
              <Button onClick={() => {
                setEditMode(false);
                setEditingItem(null);
                setShowBilesenAdiDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Bileşen Adı Ekle
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {iskeleBilesenAdlari.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">{item.bilesen_adi}</h3>
                        {item.aciklama && (
                          <p className="text-sm text-gray-600 mt-1">{item.aciklama}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(item, 'bilesen_adi')}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(item, 'bilesen_adi')}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Kalibrasyon Section */}
        {activeSection === 'kalibrasyon' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">{kalibrasyonCihazlari.length} ölçüm cihazı</p>
              <Button
                onClick={() => {
                  setEditMode(false);
                  setEditingItem(null);
                  setNewKalibrasyon({ cihaz_adi: '', seri_no: '', kalibrasyon_tarihi: '' });
                  setShowKalibrasyonDialog(true);
                }}
                className="bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white"
                data-testid="add-calibration-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ölçüm Cihazı Ekle
              </Button>
            </div>

            <div className="grid gap-3">
              {kalibrasyonCihazlari.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gauge className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Henüz ölçüm cihazı eklenmemiş</p>
                </div>
              ) : (
                kalibrasyonCihazlari.map((cihaz) => (
                  <Card key={cihaz.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                              <Gauge className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{cihaz.cihaz_adi}</h3>
                              <p className="text-sm text-gray-500">Seri No: {cihaz.seri_no}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Kalibrasyon Tarihi</p>
                            <p className="text-sm font-medium text-teal-600">{cihaz.kalibrasyon_tarihi}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(cihaz, 'kalibrasyon')}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              Düzenle
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteKalibrasyon(cihaz.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={(open) => !open && handleCloseDialog('user')}>
        <DialogContent data-testid="create-user-dialog">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Oluştur'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Kullanıcı bilgilerini güncelleyin' : 'Sisteme yeni bir kullanıcı ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-username">Kullanıcı Adı</Label>
              <Input
                id="user-username"
                type="text"
                placeholder="kullaniciadi"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                data-testid="user-username-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="kullanici@email.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                data-testid="user-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Şifre {editMode && <span className="text-xs text-gray-500">(Değiştirmek istemiyorsanız boş bırakın)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  data-testid="user-password-input"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password-confirm">Şifre Tekrar</Label>
              <div className="relative">
                <Input
                  id="user-password-confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={newUser.password_confirm}
                  onChange={(e) => setNewUser({ ...newUser, password_confirm: e.target.value })}
                  data-testid="user-password-confirm-input"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Rol</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Görüntüleyici</SelectItem>
                  <SelectItem value="inspector">Müfettiş</SelectItem>
                  <SelectItem value="admin">Yönetici</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('user')} data-testid="cancel-user-button">
              İptal
            </Button>
            <Button onClick={handleCreateUser} data-testid="submit-user-button">
              {editMode ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Kategori Dialog */}
      <Dialog open={showKategoriDialog} onOpenChange={setShowKategoriDialog}>
        <DialogContent data-testid="create-category-dialog">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Kategori Düzenle' : 'Yeni Kategori Oluştur'}</DialogTitle>
            <DialogDescription>
              Raporlar için yeni bir kategori ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kategori-isim">Kategori Adı *</Label>
              <Input
                id="kategori-isim"
                placeholder="Örn: Vinç"
                value={newKategori.isim}
                onChange={(e) => setNewKategori({ ...newKategori, isim: e.target.value })}
                data-testid="category-name-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kategori-aciklama">Açıklama (Opsiyonel)</Label>
              <Input
                id="kategori-aciklama"
                placeholder="Kategori açıklaması"
                value={newKategori.aciklama}
                onChange={(e) => setNewKategori({ ...newKategori, aciklama: e.target.value })}
                data-testid="category-description-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt-kategoriler">Alt Kategoriler (Opsiyonel)</Label>
              <div className="flex gap-2">
                <Input
                  id="alt-kategoriler"
                  placeholder="Alt kategori girin"
                  value={altKategoriInput}
                  onChange={(e) => setAltKategoriInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (altKategoriInput.trim()) {
                        setNewKategori({
                          ...newKategori,
                          alt_kategoriler: [...newKategori.alt_kategoriler, altKategoriInput.trim()]
                        });
                        setAltKategoriInput('');
                      }
                    }
                  }}
                  data-testid="alt-category-input"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (altKategoriInput.trim()) {
                      setNewKategori({
                        ...newKategori,
                        alt_kategoriler: [...newKategori.alt_kategoriler, altKategoriInput.trim()]
                      });
                      setAltKategoriInput('');
                    }
                  }}
                  data-testid="add-alt-category-button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newKategori.alt_kategoriler.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newKategori.alt_kategoriler.map((altKat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{altKat}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewKategori({
                            ...newKategori,
                            alt_kategoriler: newKategori.alt_kategoriler.filter((_, i) => i !== index)
                          });
                        }}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKategoriDialog(false)} data-testid="cancel-category-button">
              İptal
            </Button>
            <Button onClick={handleCreateKategori} data-testid="submit-category-button">
              {editMode ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kategori Excel Import Dialog */}
      <Dialog open={showKategoriImportDialog} onOpenChange={setShowKategoriImportDialog}>
        <DialogContent data-testid="import-category-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Kategorileri Excel'den İçe Aktar
            </DialogTitle>
            <DialogDescription>
              Excel dosyası ile toplu kategori ekleyin. Mevcut kategoriler güncellenmez, sadece yeniler eklenir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Şablon Formatı</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Kategori Adı*</strong> - Zorunlu alan</li>
                <li>• <strong>Alt Kategoriler</strong> - Virgülle ayrılmış (Vinç, Forklift, Platform)</li>
                <li>• <strong>Açıklama</strong> - Opsiyonel</li>
              </ul>
              <Button
                variant="link"
                className="text-blue-600 p-0 h-auto mt-2"
                onClick={handleDownloadKategoriTemplate}
              >
                <Download className="h-4 w-4 mr-1" />
                Örnek şablonu indir
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori-file">Excel Dosyası Seçin</Label>
              <Input
                id="kategori-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setKategoriImportFile(e.target.files[0])}
                data-testid="category-import-file-input"
              />
              {kategoriImportFile && (
                <p className="text-sm text-gray-600">
                  Seçilen dosya: {kategoriImportFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowKategoriImportDialog(false);
                setKategoriImportFile(null);
              }}
              disabled={kategoriImporting}
            >
              İptal
            </Button>
            <Button 
              onClick={handleKategoriImport}
              disabled={!kategoriImportFile || kategoriImporting}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="submit-category-import-button"
            >
              {kategoriImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  İçe Aktar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Proje Dialog */}
      <Dialog open={showProjeDialog} onOpenChange={setShowProjeDialog}>
        <DialogContent className="max-w-3xl" data-testid="create-project-dialog">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Proje Düzenle' : 'Yeni Proje Oluştur'}</DialogTitle>
            <DialogDescription>
              Raporlar için yeni bir proje ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proje-adi">Proje Adı *</Label>
                <Input
                  id="proje-adi"
                  placeholder="Örn: Ankara Konut Projesi"
                  value={newProje.proje_adi}
                  onChange={(e) => setNewProje({ ...newProje, proje_adi: e.target.value })}
                  data-testid="project-name-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firma-adi">Firma Adı *</Label>
                <Input
                  id="firma-adi"
                  placeholder="Örn: ABC İnşaat Ltd."
                  value={newProje.firma_adi}
                  onChange={(e) => setNewProje({ ...newProje, firma_adi: e.target.value })}
                  data-testid="project-company-input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proje-kodu">Proje Kodu *</Label>
                <Input
                  id="proje-kodu"
                  placeholder="Örn: PRJ-2025-001"
                  value={newProje.proje_kodu}
                  onChange={(e) => setNewProje({ ...newProje, proje_kodu: e.target.value })}
                  data-testid="project-code-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proje-lokasyon">Lokasyon</Label>
                <Input
                  id="proje-lokasyon"
                  placeholder="Proje lokasyonu"
                  value={newProje.lokasyon}
                  onChange={(e) => setNewProje({ ...newProje, lokasyon: e.target.value })}
                  data-testid="project-location-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baslangic-tarihi">Başlangıç Tarihi</Label>
                <Input
                  id="baslangic-tarihi"
                  type="date"
                  value={newProje.baslangic_tarihi}
                  onChange={(e) => setNewProje({ ...newProje, baslangic_tarihi: e.target.value })}
                  data-testid="project-start-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitis-tarihi">Bitiş Tarihi</Label>
                <Input
                  id="bitis-tarihi"
                  type="date"
                  value={newProje.bitis_tarihi}
                  onChange={(e) => setNewProje({ ...newProje, bitis_tarihi: e.target.value })}
                  data-testid="project-end-date-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proje-durum">Durum</Label>
              <Select value={newProje.durum} onValueChange={(value) => setNewProje({ ...newProje, durum: value })}>
                <SelectTrigger data-testid="project-status-select">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="Askıda">Askıda</SelectItem>
                  <SelectItem value="İptal">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proje-aciklama">Açıklama</Label>
              <Textarea
                id="proje-aciklama"
                placeholder="Proje hakkında detaylı açıklama"
                value={newProje.aciklama}
                onChange={(e) => setNewProje({ ...newProje, aciklama: e.target.value })}
                data-testid="project-description-input"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjeDialog(false)} data-testid="cancel-project-button">
              İptal
            </Button>
            <Button onClick={handleCreateProje} data-testid="submit-project-button">
              {editMode ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* İskele Bileşen Adı Dialog */}
      <Dialog open={showBilesenAdiDialog} onOpenChange={() => handleCloseDialog('bilesen_adi')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Bileşen Adı Düzenle' : 'Yeni Bileşen Adı Ekle'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'İskele bileşen adını güncelleyin.' : 'Yeni bir iskele bileşen adı oluşturun.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bilesen_adi">Bileşen Adı *</Label>
              <Input
                id="bilesen_adi"
                placeholder="Örn: Çelik Direk, İskele Borusu, vb."
                value={newBilesenAdi.bilesen_adi}
                onChange={(e) => setNewBilesenAdi({ ...newBilesenAdi, bilesen_adi: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                placeholder="Bileşen hakkında açıklama (opsiyonel)"
                value={newBilesenAdi.aciklama}
                onChange={(e) => setNewBilesenAdi({ ...newBilesenAdi, aciklama: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('bilesen_adi')}>
              İptal
            </Button>
            <Button onClick={handleCreateBilesenAdi}>
              {editMode ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kalibrasyon Cihazı Dialog */}
      <Dialog open={showKalibrasyonDialog} onOpenChange={() => handleCloseDialog('kalibrasyon')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Ölçüm Cihazı Düzenle' : 'Yeni Ölçüm Cihazı Ekle'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Ölçüm cihazı bilgilerini güncelleyin.' : 'Yeni bir ölçüm cihazı ekleyin.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cihaz_adi">Cihaz Adı *</Label>
              <Input
                id="cihaz_adi"
                placeholder="Örn: Kumpas, Termometre, vb."
                value={newKalibrasyon.cihaz_adi}
                onChange={(e) => setNewKalibrasyon({ ...newKalibrasyon, cihaz_adi: e.target.value })}
                data-testid="calibration-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seri_no">Seri No *</Label>
              <Input
                id="seri_no"
                placeholder="Cihaz seri numarası"
                value={newKalibrasyon.seri_no}
                onChange={(e) => setNewKalibrasyon({ ...newKalibrasyon, seri_no: e.target.value })}
                data-testid="calibration-serial-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kalibrasyon_tarihi">Kalibrasyon Tarihi *</Label>
              <Input
                id="kalibrasyon_tarihi"
                type="date"
                value={newKalibrasyon.kalibrasyon_tarihi}
                onChange={(e) => setNewKalibrasyon({ ...newKalibrasyon, kalibrasyon_tarihi: e.target.value })}
                data-testid="calibration-date-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('kalibrasyon')}>
              İptal
            </Button>
            <Button onClick={handleCreateKalibrasyon} className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white">
              {editMode ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              {deleteType === 'user' ? 'Kullanıcıyı Sil' : deleteType === 'kategori' ? 'Kategoriyi Sil' : 'Projeyi Sil'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'user'
                ? `${deleteItem?.email} kullanıcısını silmek istediğinizden emin misiniz?`
                : deleteType === 'kategori'
                  ? `${deleteItem?.isim} kategorisini silmek istediğinizden emin misiniz? Bu kategoriye ait raporlar etkilenmeyecektir.`
                  : `${deleteItem?.proje_adi} projesini silmek istediğinizden emin misiniz?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-dialog-button">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-dialog-button"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout >
  );
};

export default AdminPanel;