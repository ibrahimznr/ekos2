import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Plus, Search, Eye, Edit, RefreshCw, Trash2, Truck, User, Phone, FileCheck, Download, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MakineExcelImportModal from '@/components/MakineExcelImportModal';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Makineler = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('makineler');
    const [makineler, setMakineler] = useState([]);
    const [operatorler, setOperatorler] = useState([]);
    const [projeler, setProjeler] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [operatorSearchTerm, setOperatorSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showOperatorModal, setShowOperatorModal] = useState(false);
    const [showMakineExcelModal, setShowMakineExcelModal] = useState(false);
    const [selectedMakine, setSelectedMakine] = useState(null);
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        proje_id: '',
        proje_adi: '',
        makine_turu: '',
        firma: '',
        plaka_seri_no: '',
        sasi_motor_no: '',
        imalat_yili: '',
        servis_bakim_tarihi: '',
        sigorta_tarihi: '',
        periyodik_kontrol_tarihi: '',
        ruhsat_muayene_tarihi: '',
        operator_adi: '',
        operator_belge_tarihi: '',
        belge_kurumu: '',
        telefon: '',
        durum: 'Aktif',
        aciklama: ''
    });

    const [operatorFormData, setOperatorFormData] = useState({
        proje_id: '',
        proje_adi: '',
        ad_soyad: '',
        telefon: '',
        makine_cinsi: '',
        belge_no: '',
        belge_turu: '',
        son_gecerlilik: '',
        durum: 'Geçerli',
        aciklama: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchMakineler();
        fetchOperatorler();
        fetchProjeler();
    }, []);

    const fetchMakineler = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API}/makineler`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMakineler(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                toast.error('Makineler yüklenemedi');
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
        setSelectedMakine(null);
        setFormData({
            proje_id: '',
            proje_adi: '',
            makine_turu: '',
            firma: '',
            plaka_seri_no: '',
            sasi_motor_no: '',
            imalat_yili: '',
            servis_bakim_tarihi: '',
            sigorta_tarihi: '',
            periyodik_kontrol_tarihi: '',
            ruhsat_muayene_tarihi: '',
            operator_adi: '',
            operator_belge_tarihi: '',
            belge_kurumu: '',
            telefon: '',
            durum: 'Aktif',
            aciklama: ''
        });
        setShowModal(true);
    };

    const handleEdit = (makine) => {
        setSelectedMakine(makine);
        setFormData({
            proje_id: makine.proje_id,
            proje_adi: makine.proje_adi,
            makine_turu: makine.makine_turu,
            firma: makine.firma,
            plaka_seri_no: makine.plaka_seri_no,
            sasi_motor_no: makine.sasi_motor_no || '',
            imalat_yili: makine.imalat_yili || '',
            servis_bakim_tarihi: makine.servis_bakim_tarihi || '',
            sigorta_tarihi: makine.sigorta_tarihi || '',
            periyodik_kontrol_tarihi: makine.periyodik_kontrol_tarihi || '',
            ruhsat_muayene_tarihi: makine.ruhsat_muayene_tarihi || '',
            operator_adi: makine.operator_adi || '',
            operator_belge_tarihi: makine.operator_belge_tarihi || '',
            belge_kurumu: makine.belge_kurumu || '',
            telefon: makine.telefon || '',
            durum: makine.durum,
            aciklama: makine.aciklama || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');

            if (selectedMakine) {
                // Update
                await axios.put(`${API}/makineler/${selectedMakine.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Makine güncellendi');
            } else {
                // Create
                await axios.post(`${API}/makineler`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Makine eklendi');
            }

            setShowModal(false);
            fetchMakineler();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'İşlem başarısız');
        }
    };

    const handleDelete = async (makineId) => {
        if (!window.confirm('Bu makineyi silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/makineler/${makineId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Makine silindi');
            fetchMakineler();
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

    const handleOperatorProjeChange = (projeId) => {
        const proje = projeler.find(p => p.id === projeId);
        setOperatorFormData({
            ...operatorFormData,
            proje_id: projeId,
            proje_adi: proje?.proje_adi || ''
        });
    };

    // Operator functions
    const fetchOperatorler = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/operatorler`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOperatorler(response.data);
        } catch (error) {
            toast.error('Operatörler yüklenemedi');
        }
    };

    const handleCreateOperator = () => {
        setSelectedOperator(null);
        setOperatorFormData({
            proje_id: '',
            proje_adi: '',
            ad_soyad: '',
            telefon: '',
            makine_cinsi: '',
            belge_no: '',
            belge_turu: '',
            son_gecerlilik: '',
            durum: 'Geçerli',
            aciklama: ''
        });
        setShowOperatorModal(true);
    };

    const handleEditOperator = (operator) => {
        setSelectedOperator(operator);
        setOperatorFormData({
            proje_id: operator.proje_id,
            proje_adi: operator.proje_adi,
            ad_soyad: operator.ad_soyad,
            telefon: operator.telefon,
            makine_cinsi: operator.makine_cinsi || '',
            belge_no: operator.belge_no,
            belge_turu: operator.belge_turu || '',
            son_gecerlilik: operator.son_gecerlilik,
            durum: operator.durum,
            aciklama: operator.aciklama || ''
        });
        setShowOperatorModal(true);
    };

    const handleSaveOperator = async () => {
        try {
            const token = localStorage.getItem('token');

            if (selectedOperator) {
                await axios.put(`${API}/operatorler/${selectedOperator.id}`, operatorFormData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Operatör güncellendi');
            } else {
                await axios.post(`${API}/operatorler`, operatorFormData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Operatör eklendi');
            }

            setShowOperatorModal(false);
            fetchOperatorler();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'İşlem başarısız');
        }
    };

    const handleDeleteOperator = async (operatorId) => {
        if (!window.confirm('Bu operatörü silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/operatorler/${operatorId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Operatör silindi');
            fetchOperatorler();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Silme başarısız');
        }
    };

    const filteredMakineler = makineler.filter(makine =>
        makine.makine_turu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        makine.plaka_seri_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        makine.firma.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOperatorler = operatorler.filter(operator =>
        operator.ad_soyad.toLowerCase().includes(operatorSearchTerm.toLowerCase()) ||
        operator.telefon.toLowerCase().includes(operatorSearchTerm.toLowerCase()) ||
        operator.belge_no.toLowerCase().includes(operatorSearchTerm.toLowerCase())
    );

    const canEdit = user?.role === 'admin' || user?.role === 'inspector';

    const handleExportMakinelerExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/makineler/excel/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `makineler_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Excel dosyası indirildi');
        } catch (error) {
            toast.error('Excel export başarısız');
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Makine Takip</h1>
                        <p className="text-gray-600 mt-1">
                            {projeler.length > 0 && projeler[0]?.proje_adi} - {activeTab === 'makineler' ? 'Makineler' : 'Operatörler'}
                        </p>
                    </div>
                    {canEdit && (
                        <Button
                            onClick={activeTab === 'makineler' ? handleCreate : handleCreateOperator}
                            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {activeTab === 'makineler' ? 'Yeni Makine' : 'Yeni Operatör'}
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="makineler">Makineler</TabsTrigger>
                        <TabsTrigger value="operatorler">Operatörler</TabsTrigger>
                    </TabsList>

                    {/* Makineler Tab */}
                    <TabsContent value="makineler" className="mt-6">
                        {/* Search */}
                        <Card className="shadow-md">
                            <CardContent className="pt-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Makine türü, plaka veya firma ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-11"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Excel Buttons */}
                        {canEdit && (
                            <div className="flex gap-2 justify-end">
                                <Button
                                    onClick={() => setShowMakineExcelModal(true)}
                                    variant="outline"
                                    className="border-blue-600 text-blue-700 hover:bg-blue-50"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Excel İçe Aktar
                                </Button>
                                <Button
                                    onClick={handleExportMakinelerExcel}
                                    variant="outline"
                                    className="border-green-600 text-green-700 hover:bg-green-50"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Excel İndir
                                </Button>
                            </div>
                        )}

                        {/* Machine List */}
                        {filteredMakineler.length === 0 ? (
                            <Card className="shadow-md">
                                <CardContent className="py-16">
                                    <div className="text-center text-gray-500">
                                        <Truck className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium mb-2">Makine bulunamadı</p>
                                        <p className="text-sm">Yeni bir makine ekleyerek başlayabilirsiniz</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredMakineler.map((makine) => (
                                    <Card key={makine.id} className="card-hover shadow-md">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-sm text-gray-500">Makine Türü</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                                        {makine.makine_turu}
                                                    </h3>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">Plaka/Seri No</span>
                                                            <p className="font-medium text-gray-800 mt-1">
                                                                {makine.plaka_seri_no}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Firma</span>
                                                            <p className="font-medium text-gray-800 mt-1">
                                                                {makine.firma}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Proje</span>
                                                            <p className="font-medium text-gray-800 mt-1">
                                                                {makine.proje_adi}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${makine.durum === 'Aktif'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        {makine.durum}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(makine)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Görüntüle
                                                </Button>
                                                {canEdit && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleEdit(makine)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Düzenle
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                                                            onClick={() => fetchMakineler()}
                                                        >
                                                            <RefreshCw className="h-4 w-4 mr-2" />
                                                            Yenile
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-600 text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(makine.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Sil
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                    </TabsContent>

                    {/* Operatörler Tab */}
                    <TabsContent value="operatorler" className="mt-6">
                        {/* Search */}
                        <Card className="shadow-md">
                            <CardContent className="pt-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Operatör adı, telefon veya belge numarası ara..."
                                        value={operatorSearchTerm}
                                        onChange={(e) => setOperatorSearchTerm(e.target.value)}
                                        className="pl-10 h-11"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operators List */}
                        {filteredOperatorler.length === 0 ? (
                            <Card className="shadow-md">
                                <CardContent className="py-16">
                                    <div className="text-center text-gray-500">
                                        <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium mb-2">Operatör bulunamadı</p>
                                        <p className="text-sm">Yeni bir operatör ekleyerek başlayabilirsiniz</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredOperatorler.map((operator) => (
                                    <Card key={operator.id} className="card-hover shadow-md">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {operator.ad_soyad}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 rounded text-xs font-medium ${operator.durum === 'Geçerli'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {operator.durum}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm mb-4">
                                                <p className="text-gray-600">{operator.proje_adi}</p>

                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-700">{operator.telefon}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <FileCheck className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <span className="text-gray-500">Belge No: </span>
                                                        <span className="font-medium text-gray-800">{operator.belge_no}</span>
                                                    </div>
                                                </div>

                                                {operator.belge_turu && (
                                                    <p className="text-gray-500">
                                                        {operator.belge_turu}
                                                    </p>
                                                )}

                                                <p className="text-gray-500">
                                                    Son Geçerlilik: <span className="font-medium">{operator.son_gecerlilik}</span>
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditOperator(operator)}
                                                    className="flex-1"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Düzenle
                                                </Button>
                                                {canEdit && user?.role === 'admin' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-600 text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteOperator(operator.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Modal */}
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {selectedMakine ? 'Makine Düzenle' : 'Yeni Makine Ekle'}
                            </DialogTitle>
                            <DialogDescription>
                                Makine bilgilerini girin
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

                            {/* Makine Türü */}
                            <div>
                                <Label htmlFor="makine_turu">Makine Türü *</Label>
                                <Input
                                    id="makine_turu"
                                    value={formData.makine_turu}
                                    onChange={(e) =>
                                        setFormData({ ...formData, makine_turu: e.target.value })
                                    }
                                    placeholder="Otomobil, Traktör, vb."
                                />
                            </div>

                            {/* Firma */}
                            <div>
                                <Label htmlFor="firma">Firma</Label>
                                <Input
                                    id="firma"
                                    value={formData.firma}
                                    onChange={(e) =>
                                        setFormData({ ...formData, firma: e.target.value })
                                    }
                                    placeholder="Firma adı"
                                />
                            </div>

                            {/* Plaka/Seri No */}
                            <div>
                                <Label htmlFor="plaka_seri_no">Plaka/Seri No</Label>
                                <Input
                                    id="plaka_seri_no"
                                    value={formData.plaka_seri_no}
                                    onChange={(e) =>
                                        setFormData({ ...formData, plaka_seri_no: e.target.value })
                                    }
                                    placeholder="01 AHC 823"
                                />
                            </div>

                            {/* Şasi/Motor No */}
                            <div>
                                <Label htmlFor="sasi_motor_no">Şasi/Motor No</Label>
                                <Input
                                    id="sasi_motor_no"
                                    value={formData.sasi_motor_no}
                                    onChange={(e) =>
                                        setFormData({ ...formData, sasi_motor_no: e.target.value })
                                    }
                                    placeholder="Şasi veya Motor No"
                                />
                            </div>

                            {/* İmalat Yılı */}
                            <div>
                                <Label htmlFor="imalat_yili">İmalat Yılı</Label>
                                <Input
                                    id="imalat_yili"
                                    value={formData.imalat_yili}
                                    onChange={(e) =>
                                        setFormData({ ...formData, imalat_yili: e.target.value })
                                    }
                                    placeholder="2020"
                                />
                            </div>

                            {/* Servis Bakım Tarihi */}
                            <div>
                                <Label htmlFor="servis_bakim_tarihi">Servis Bakım Tarihi</Label>
                                <Input
                                    id="servis_bakim_tarihi"
                                    type="date"
                                    value={formData.servis_bakim_tarihi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, servis_bakim_tarihi: e.target.value })
                                    }
                                />
                            </div>

                            {/* Sigorta Tarihi */}
                            <div>
                                <Label htmlFor="sigorta_tarihi">Sigorta Tarihi</Label>
                                <Input
                                    id="sigorta_tarihi"
                                    type="date"
                                    value={formData.sigorta_tarihi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, sigorta_tarihi: e.target.value })
                                    }
                                />
                            </div>

                            {/* Periyodik Kontrol Tarihi */}
                            <div>
                                <Label htmlFor="periyodik_kontrol_tarihi">Periyodik Kontrol Tarihi</Label>
                                <Input
                                    id="periyodik_kontrol_tarihi"
                                    type="date"
                                    value={formData.periyodik_kontrol_tarihi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, periyodik_kontrol_tarihi: e.target.value })
                                    }
                                />
                            </div>

                            {/* Ruhsat Muayene Tarihi */}
                            <div>
                                <Label htmlFor="ruhsat_muayene_tarihi">Ruhsat Muayene Tarihi</Label>
                                <Input
                                    id="ruhsat_muayene_tarihi"
                                    type="date"
                                    value={formData.ruhsat_muayene_tarihi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, ruhsat_muayene_tarihi: e.target.value })
                                    }
                                />
                            </div>

                            {/* Operatör Adı */}
                            <div>
                                <Label htmlFor="operator_adi">Operatör Adı</Label>
                                <Input
                                    id="operator_adi"
                                    value={formData.operator_adi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, operator_adi: e.target.value })
                                    }
                                    placeholder="Operatör adı"
                                />
                            </div>

                            {/* Operatör Belge Tarihi */}
                            <div>
                                <Label htmlFor="operator_belge_tarihi">Operatör Belge Tarihi</Label>
                                <Input
                                    id="operator_belge_tarihi"
                                    type="date"
                                    value={formData.operator_belge_tarihi}
                                    onChange={(e) =>
                                        setFormData({ ...formData, operator_belge_tarihi: e.target.value })
                                    }
                                />
                            </div>

                            {/* Belge Kurumu */}
                            <div>
                                <Label htmlFor="belge_kurumu">Belge Kurumu</Label>
                                <Input
                                    id="belge_kurumu"
                                    value={formData.belge_kurumu}
                                    onChange={(e) =>
                                        setFormData({ ...formData, belge_kurumu: e.target.value })
                                    }
                                    placeholder="Belge kurumu"
                                />
                            </div>

                            {/* Telefon */}
                            <div>
                                <Label htmlFor="telefon">Telefon</Label>
                                <Input
                                    id="telefon"
                                    value={formData.telefon}
                                    onChange={(e) =>
                                        setFormData({ ...formData, telefon: e.target.value })
                                    }
                                    placeholder="Telefon numarası"
                                />
                            </div>

                            {/* Durum */}
                            <div className="md:col-span-2">
                                <Label htmlFor="durum">Durum</Label>
                                <Select
                                    value={formData.durum}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, durum: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Aktif">Aktif</SelectItem>
                                        <SelectItem value="Pasif">Pasif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                İptal
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={
                                    !formData.proje_id ||
                                    !formData.makine_turu
                                }
                            >
                                {selectedMakine ? 'Güncelle' : 'Ekle'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Operator Modal */}
                <Dialog open={showOperatorModal} onOpenChange={setShowOperatorModal}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {selectedOperator ? 'Operatör Düzenle' : 'Yeni Operatör Ekle'}
                            </DialogTitle>
                            <DialogDescription>
                                Operatör bilgilerini girin
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Proje */}
                            <div>
                                <Label htmlFor="operator_proje">Proje *</Label>
                                <Select
                                    value={operatorFormData.proje_id}
                                    onValueChange={handleOperatorProjeChange}
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

                            {/* Ad Soyad */}
                            <div>
                                <Label htmlFor="ad_soyad">Ad Soyad *</Label>
                                <Input
                                    id="ad_soyad"
                                    value={operatorFormData.ad_soyad}
                                    onChange={(e) =>
                                        setOperatorFormData({ ...operatorFormData, ad_soyad: e.target.value })
                                    }
                                    placeholder="Operatör adı soyadı"
                                />
                            </div>

                            {/* Telefon */}
                            <div>
                                <Label htmlFor="operator_telefon">Telefon</Label>
                                <Input
                                    id="operator_telefon"
                                    value={operatorFormData.telefon}
                                    onChange={(e) =>
                                        setOperatorFormData({ ...operatorFormData, telefon: e.target.value })
                                    }
                                    placeholder="5XX XXX XX XX"
                                />
                            </div>

                            {/* Makine Cinsi */}
                            <div>
                                <Label htmlFor="makine_cinsi">Makine Cinsi</Label>
                                <Input
                                    id="makine_cinsi"
                                    value={operatorFormData.makine_cinsi}
                                    onChange={(e) =>
                                        setOperatorFormData({ ...operatorFormData, makine_cinsi: e.target.value })
                                    }
                                    placeholder="Forklift, Vinç, vb."
                                />
                            </div>

                            {/* Belge Numarası */}
                            <div>
                                <Label htmlFor="belge_no">Belge Numarası</Label>
                                <Input
                                    id="belge_no"
                                    value={operatorFormData.belge_no}
                                    onChange={(e) =>
                                        setOperatorFormData({ ...operatorFormData, belge_no: e.target.value })
                                    }
                                    placeholder="Belge numarası"
                                />
                            </div>

                            {/* Belge Kurumu */}
                            <div className="md:col-span-2">
                                <Label htmlFor="belge_turu">Belge Kurumu</Label>
                                <Input
                                    id="belge_turu"
                                    value={operatorFormData.belge_turu}
                                    onChange={(e) =>
                                        setOperatorFormData({ ...operatorFormData, belge_turu: e.target.value })
                                    }
                                    placeholder="Ekipler, vb."
                                />
                            </div>

                            {/* Belge Tarihi */}
                            <div>
                                <Label htmlFor="belge_tarihi">Belge Tarihi</Label>
                                <Input
                                    id="belge_tarihi"
                                    type="date"
                                    placeholder="gg.aa.yyyy"
                                />
                            </div>

                            {/* Belge Geçerlilik Tarihi */}
                            <div>
                                <Label htmlFor="son_gecerlilik">Belge Geçerlilik Tarihi</Label>
                                <Input
                                    id="son_gecerlilik"
                                    type="date"
                                    value={operatorFormData.son_gecerlilik}
                                    onChange={(e) =>
                                        setOperatorFormData({ ...operatorFormData, son_gecerlilik: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowOperatorModal(false)}>
                                İptal
                            </Button>
                            <Button
                                onClick={handleSaveOperator}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={
                                    !operatorFormData.proje_id ||
                                    !operatorFormData.ad_soyad
                                }
                            >
                                {selectedOperator ? 'Güncelle' : 'Ekle'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Makine Excel Import Modal */}
                <MakineExcelImportModal
                    open={showMakineExcelModal}
                    onClose={() => setShowMakineExcelModal(false)}
                    onSuccess={fetchMakineler}
                />
            </div>
        </Layout>
    );
};

export default Makineler;
