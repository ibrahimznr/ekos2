import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Trash2, Users, FolderTree, Shield, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showKategoriDialog, setShowKategoriDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'user' or 'kategori'
  
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', password_confirm: '', role: 'viewer' });
  const [newKategori, setNewKategori] = useState({ isim: '', aciklama: '' });

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
    await Promise.all([fetchUsers(), fetchKategoriler()]);
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

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Kullanıcı oluşturuldu');
      setShowUserDialog(false);
      setNewUser({ username: '', email: '', password: '', password_confirm: '', role: 'viewer' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı oluşturulamadı');
    }
  };

  const handleCreateKategori = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/kategoriler`, newKategori, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Kategori oluşturuldu');
      setShowKategoriDialog(false);
      setNewKategori({ isim: '', aciklama: '' });
      fetchKategoriler();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kategori oluşturulamadı');
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
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    } finally {
      setShowDeleteDialog(false);
      setDeleteItem(null);
      setDeleteType('');
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-700" />
            Yönetim Paneli
          </h1>
          <p className="text-gray-600">Kullanıcı ve kategori yönetimi</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="users-tab">
              <Users className="h-4 w-4" />
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="kategoriler" className="flex items-center gap-2" data-testid="categories-tab">
              <FolderTree className="h-4 w-4" />
              Kategoriler
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">{users.length} kullanıcı</p>
              <Button
                onClick={() => setShowUserDialog(true)}
                className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                data-testid="create-user-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <Card key={u.id} className="card-hover shadow-md" data-testid={`user-card-${u.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">@{u.username}</h3>
                        <p className="text-xs text-gray-600 mb-2">{u.email}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </div>
                      {u.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(u, 'user')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-user-${u.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Oluşturulma: {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Kategoriler Tab */}
          <TabsContent value="kategoriler" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">{kategoriler.length} kategori</p>
              <Button
                onClick={() => setShowKategoriDialog(true)}
                className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                data-testid="create-category-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kategori
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kategoriler.map((kat) => (
                <Card key={kat.id} className="card-hover shadow-md" data-testid={`category-card-${kat.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">{kat.isim}</h3>
                        {kat.aciklama && (
                          <p className="text-sm text-gray-600">{kat.aciklama}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(kat, 'kategori')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-category-${kat.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent data-testid="create-user-dialog">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
            <DialogDescription>
              Sisteme yeni bir kullanıcı ekleyin
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
              <Label htmlFor="user-password">Şifre</Label>
              <Input
                id="user-password"
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                data-testid="user-password-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password-confirm">Şifre Tekrar</Label>
              <Input
                id="user-password-confirm"
                type="password"
                placeholder="••••••••"
                value={newUser.password_confirm}
                onChange={(e) => setNewUser({ ...newUser, password_confirm: e.target.value })}
                data-testid="user-password-confirm-input"
              />
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
            <Button variant="outline" onClick={() => setShowUserDialog(false)} data-testid="cancel-user-button">
              İptal
            </Button>
            <Button onClick={handleCreateUser} data-testid="submit-user-button">
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Kategori Dialog */}
      <Dialog open={showKategoriDialog} onOpenChange={setShowKategoriDialog}>
        <DialogContent data-testid="create-category-dialog">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
            <DialogDescription>
              Raporlar için yeni bir kategori ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kategori-isim">Kategori Adı</Label>
              <Input
                id="kategori-isim"
                placeholder="Örn: Vinç"
                value={newKategori.isim}
                onChange={(e) => setNewKategori({ ...newKategori, isim: e.target.value })}
                data-testid="category-name-input"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKategoriDialog(false)} data-testid="cancel-category-button">
              İptal
            </Button>
            <Button onClick={handleCreateKategori} data-testid="submit-category-button">
              Oluştur
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
              {deleteType === 'user' ? 'Kullanıcıyı Sil' : 'Kategoriyi Sil'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'user'
                ? `${deleteItem?.email} kullanıcısını silmek istediğinizden emin misiniz?`
                : `${deleteItem?.isim} kategorisini silmek istediğinizden emin misiniz? Bu kategoriye ait raporlar etkilenmeyecektir.`}
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
    </Layout>
  );
};

export default AdminPanel;