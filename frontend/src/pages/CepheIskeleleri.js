import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Building2, MapPin, Calendar } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const YAPI_YONLERI = ['Doğu', 'Batı', 'Kuzey', 'Güney'];

const CepheIskeleleri = () => {
    const navigate = useNavigate();
    const [iskeleleri, setIskeleleri] = useState([]);
    const [projeler, setProjeler] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedIskele, setSelectedIskele] = useState(null);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        proje_id: '',
        proje_adi: '',
        proje_muhendisi: '',
        statik_raporu: false,
        kurulum_projesi: false,
        lokasyon: '',
        blok_yapi_adi: '',
        yapi_yonu: '',
        gecerlilik_tarihi: '',
        aciklama: '',
        durum: 'Aktif'
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchIskeleleri();
        fetchProjeler();
    }, []);

    const fetchIskeleleri = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API}/cephe-iskeleleri`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIskeleleri(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                toast.error('Cephe iskeleleri yüklenemedi');
            }
        } finally {
            setLoading(false);
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
            console.error('Projeler yüklenemedi:', error);
        }
    };

    const handleCreate = () => {
        setSelectedIskele(null);
        setFormData({
            proje_id: '',
            proje_adi: '',
            proje_muhendisi: '',
            statik_raporu: false,
            kurulum_projesi: false,
            lokasyon: '',
            blok_yapi_adi: '',
            yapi_yonu: '',
            gecerlilik_tarihi: '',
            aciklama: '',
            durum: 'Aktif'
        });
        setShowModal(true);
    };

    const handleEdit = (iskele) => {
        setSelectedIskele(iskele);
        setFormData({
            proje_id: iskele.proje_id,
            proje_adi: iskele.proje_adi,
            proje_muhendisi: iskele.proje_muhendisi || '',
            statik_raporu: iskele.statik_raporu || false,
            kurulum_projesi: iskele.kurulum_projesi || false,
            lokasyon: iskele.lokasyon || '',
            blok_yapi_adi: iskele.blok_yapi_adi || '',
            yapi_yonu: iskele.yapi_yonu || '',
            gecerlilik_tarihi: iskele.gecerlilik_tarihi || '',
            aciklama: iskele.aciklama || '',
            durum: iskele.durum || 'Aktif'
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');

            if (selectedIskele) {
                // Update
                await axios.put(`${API}/cephe-iskeleleri/${selectedIskele.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Cephe iskelesi güncellendi');
            } else {
                // Create
                await axios.post(`${API}/cephe-iskeleleri`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Cephe iskelesi eklendi');
            }

            setShowModal(false);
            fetchIskeleleri();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'İşlem başarısız');
        }
    };

    const handleDelete = async (iskeleId) => {
        if (!window.confirm('Bu cephe iskelesini silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/cephe-iskeleleri/${iskeleId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Cephe iskelesi silindi');
            fetchIskeleleri();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Silme başarısız');
        }
    };

    const handleProjeChange = (projeId) => {
        const proje = projeler.find(p => p.id === projeId);
        setFormData({
            ...formData,
            proje_id: projeId,
            proje_adi: proje?.proje_adi || ''
        });
    };

    const filteredIskeleleri = iskeleleri.filter(iskele =>
        iskele.proje_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iskele.lokasyon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iskele.blok_yapi_adi?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canEdit = user?.role === 'admin' || user?.role === 'inspector';

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Yükleniyor...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Cephe İskeleleri</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredIskeleleri.length} cephe iskelesi bulundu
                        </p>
                    </div>
                    {canEdit && (
                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Rapor Ekle
                        </Button>
                    )}
                </div>

                {/* Search */}
                <Card className="shadow-md">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Proje, lokasyon veya yapı adı ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* List */}
                {filteredIskeleleri.length === 0 ? (
                    <Card className="shadow-md">
                        <CardContent className="py-16">
                            <div className="text-center text-gray-500">
                                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium mb-2">Cephe iskelesi bulunamadı</p>
                                <p className="text-sm">Yeni bir rapor ekleyerek başlayabilirsiniz</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredIskeleleri.map((iskele) => (
                            <Card key={iskele.id} className="card-hover shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {iskele.blok_yapi_adi || 'İsimsiz'}
                                        </h3>
                                        <span
                                            className={`px-3 py-1 rounded text-xs font-medium ${iskele.durum === 'Aktif'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {iskele.durum}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <p className="text-gray-600 font-medium">{iskele.proje_adi}</p>

                                        {iskele.proje_muhendisi && (
                                            <p className="text-gray-500">
                                                Müh: {iskele.proje_muhendisi}
                                            </p>
                                        )}

                                        {iskele.lokasyon && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-700">{iskele.lokasyon}</span>
                                            </div>
                                        )}

                                        {iskele.yapi_yonu && (
                                            <p className="text-gray-500">
                                                Yön: {iskele.yapi_yonu}
                                            </p>
                                        )}

                                        {iskele.gecerlilik_tarihi && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-700">{iskele.gecerlilik_tarihi}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-2">
                                            {iskele.statik_raporu && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    Statik Rapor
                                                </span>
                                            )}
                                            {iskele.kurulum_projesi && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                    Kurulum Projesi
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {canEdit && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(iskele)}
                                                className="flex-1"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Düzenle
                                            </Button>
                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-600 text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(iskele.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal */}
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {selectedIskele ? 'Rapor Düzenle' : 'Yeni Rapor Ekle'}
                            </DialogTitle>
                            <DialogDescription>
                                Cephe iskelesi rapor bilgilerini girin
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Proje */}
                            <div>
                                <Label htmlFor="proje">Proje *</Label>
                                <Select
                                    value={formData.proje_id}
                                    onValueChange={handleProjeChange}
                                >
                                    <SelectTrigger>
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

                            {/* Proje Mühellifi */}
                            <div>
                                <Label htmlFor="proje_muhendisi">Proje Mühellifi</Label>
                                <Input
                                    id="proje_muhendisi"
                                    value={formData.proje_muhendisi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, proje_muhendisi: e.target.value })
                                    }
                                    placeholder="Mühendis adı"
                                />
                            </div>

                            {/* Lokasyon */}
                            <div>
                                <Label htmlFor="lokasyon">Lokasyon</Label>
                                <Input
                                    id="lokasyon"
                                    value={formData.lokasyon}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lokasyon: e.target.value })
                                    }
                                    placeholder="Lokasyon"
                                />
                            </div>

                            {/* Blok/Yapı Adı */}
                            <div>
                                <Label htmlFor="blok_yapi_adi">Blok veya Yapı Adı</Label>
                                <Input
                                    id="blok_yapi_adi"
                                    value={formData.blok_yapi_adi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, blok_yapi_adi: e.target.value })
                                    }
                                    placeholder="Blok/Yapı adı"
                                />
                            </div>

                            {/* Yapı Yönü */}
                            <div>
                                <Label htmlFor="yapi_yonu">Yapı Yönü</Label>
                                <Select
                                    value={formData.yapi_yonu}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, yapi_yonu: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Yön seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YAPI_YONLERI.map((yon) => (
                                            <SelectItem key={yon} value={yon}>
                                                {yon}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Geçerlilik Tarihi */}
                            <div>
                                <Label htmlFor="gecerlilik_tarihi">Geçerlilik Tarihi</Label>
                                <Input
                                    id="gecerlilik_tarihi"
                                    type="date"
                                    value={formData.gecerlilik_tarihi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, gecerlilik_tarihi: e.target.value })
                                    }
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="md:col-span-2 flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="statik_raporu"
                                        checked={formData.statik_raporu}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, statik_raporu: checked })
                                        }
                                    />
                                    <Label htmlFor="statik_raporu" className="cursor-pointer">
                                        Statik Raporu
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="kurulum_projesi"
                                        checked={formData.kurulum_projesi}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, kurulum_projesi: checked })
                                        }
                                    />
                                    <Label htmlFor="kurulum_projesi" className="cursor-pointer">
                                        Kurulum Projesi
                                    </Label>
                                </div>
                            </div>

                            {/* Açıklama */}
                            <div className="md:col-span-2">
                                <Label htmlFor="aciklama">Açıklama</Label>
                                <Textarea
                                    id="aciklama"
                                    value={formData.aciklama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, aciklama: e.target.value })
                                    }
                                    placeholder="Ek notlar veya açıklamalar..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                İptal
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={!formData.proje_id}
                            >
                                {selectedIskele ? 'Güncelle' : 'Ekle'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};

export default CepheIskeleleri;
