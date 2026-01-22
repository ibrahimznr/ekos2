import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { User, Lock, Settings, Save, Eye, EyeOff, Mail, MapPin, Calendar, Building2, Phone } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Ayarlar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profil');

    // Profile form state
    const [profileData, setProfileData] = useState({
        ad: '',
        soyad: '',
        sehir: '',
        dogum_tarihi: '',
        telefon: '',
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setProfileData({
                ad: parsedUser.ad || '',
                soyad: parsedUser.soyad || '',
                sehir: parsedUser.sehir || '',
                dogum_tarihi: parsedUser.dogum_tarihi || '',
                telefon: parsedUser.telefon || '',
            });
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API}/auth/profile`, profileData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Update local storage with new user data
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            toast.success('Profil bilgileri güncellendi');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Profil güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.new_password_confirm) {
            toast.error('Yeni şifreler eşleşmiyor');
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error('Yeni şifre en az 6 karakter olmalıdır');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/auth/change-password`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirm: passwordData.new_password_confirm,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success('Şifre başarıyla değiştirildi');
            setPasswordData({
                current_password: '',
                new_password: '',
                new_password_confirm: '',
            });
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Şifre değiştirilemedi');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
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
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
                        <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Ayarlar</h1>
                        <p className="text-sm text-gray-600">Hesap ve profil ayarlarınızı yönetin</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="profil" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Profil</span>
                        </TabsTrigger>
                        <TabsTrigger value="hesap" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="hidden sm:inline">Hesap</span>
                        </TabsTrigger>
                        <TabsTrigger value="guvenlik" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span className="hidden sm:inline">Güvenlik</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profil Tab */}
                    <TabsContent value="profil">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Profil Bilgileri
                                </CardTitle>
                                <CardDescription>
                                    Kişisel bilgilerinizi güncelleyin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ad" className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-500" />
                                                Ad
                                            </Label>
                                            <Input
                                                id="ad"
                                                type="text"
                                                placeholder="Adınız"
                                                value={profileData.ad}
                                                onChange={(e) => setProfileData({ ...profileData, ad: e.target.value })}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="soyad" className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-500" />
                                                Soyad
                                            </Label>
                                            <Input
                                                id="soyad"
                                                type="text"
                                                placeholder="Soyadınız"
                                                value={profileData.soyad}
                                                onChange={(e) => setProfileData({ ...profileData, soyad: e.target.value })}
                                                className="h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sehir" className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                Şehir
                                            </Label>
                                            <Input
                                                id="sehir"
                                                type="text"
                                                placeholder="Yaşadığınız şehir"
                                                value={profileData.sehir}
                                                onChange={(e) => setProfileData({ ...profileData, sehir: e.target.value })}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dogum_tarihi" className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                Doğum Tarihi
                                            </Label>
                                            <Input
                                                id="dogum_tarihi"
                                                type="date"
                                                value={profileData.dogum_tarihi}
                                                onChange={(e) => setProfileData({ ...profileData, dogum_tarihi: e.target.value })}
                                                className="h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="telefon" className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            Cep Telefonu
                                        </Label>
                                        <Input
                                            id="telefon"
                                            type="tel"
                                            placeholder="05XX XXX XX XX"
                                            value={profileData.telefon}
                                            onChange={(e) => setProfileData({ ...profileData, telefon: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                                        disabled={loading}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Hesap Tab */}
                    <TabsContent value="hesap">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    Hesap Bilgileri
                                </CardTitle>
                                <CardDescription>
                                    Hesap detaylarınız (sadece görüntüleme)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <Label className="text-xs text-gray-500">Kullanıcı Adı</Label>
                                        <p className="font-medium text-gray-800">@{user.username}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <Label className="text-xs text-gray-500">Email</Label>
                                        <p className="font-medium text-gray-800">{user.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <Label className="text-xs text-gray-500">Rol</Label>
                                        <p className="font-medium text-gray-800">
                                            {user.role === 'admin' ? 'Yönetici' : user.role === 'inspector' ? 'Müfettiş' : 'Görüntüleyici'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <Label className="text-xs text-gray-500">Firma</Label>
                                        <p className="font-medium text-gray-800">{user.firma_adi || '-'}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Label className="text-xs text-gray-500">Email Doğrulama</Label>
                                    <p className={`font-medium ${user.email_verified ? 'text-green-600' : 'text-amber-600'}`}>
                                        {user.email_verified ? '✓ Doğrulanmış' : '⚠ Doğrulanmamış'}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    * Email ve kullanıcı adı değişikliği için yönetici ile iletişime geçin.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Güvenlik Tab */}
                    <TabsContent value="guvenlik">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-blue-600" />
                                    Şifre Değiştir
                                </CardTitle>
                                <CardDescription>
                                    Hesabınızın güvenliği için şifrenizi düzenli olarak güncelleyin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password">Mevcut Şifre</Label>
                                        <div className="relative">
                                            <Input
                                                id="current_password"
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                placeholder="Mevcut şifreniz"
                                                value={passwordData.current_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                                required
                                                className="h-11 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new_password">Yeni Şifre</Label>
                                        <div className="relative">
                                            <Input
                                                id="new_password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                placeholder="Yeni şifreniz (en az 6 karakter)"
                                                value={passwordData.new_password}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                required
                                                minLength={6}
                                                className="h-11 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new_password_confirm">Yeni Şifre Tekrar</Label>
                                        <div className="relative">
                                            <Input
                                                id="new_password_confirm"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Yeni şifrenizi tekrar girin"
                                                value={passwordData.new_password_confirm}
                                                onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
                                                required
                                                className="h-11 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white"
                                        disabled={loading}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default Ayarlar;
