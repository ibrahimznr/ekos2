import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Upload, Trash2, Play, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DrawDetailPage = () => {
  const { drawId } = useParams();
  const navigate = useNavigate();
  const [draw, setDraw] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [idNo, setIdNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [uploading, setUploading] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadData();
  }, [drawId]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [drawRes, participantsRes] = await Promise.all([
        axios.get(`${API}/draws/${drawId}`, { headers }),
        axios.get(`${API}/draws/${drawId}/participants`, { headers })
      ]);
      setDraw(drawRes.data);
      setParticipants(participantsRes.data);
    } catch (error) {
      console.error('Veri yüklenemedi:', error);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    
    if (!idNo || !firstName || !lastName || !contact) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/draws/${drawId}/participants`, {
        id_no: idNo,
        first_name: firstName,
        last_name: lastName,
        contact: contact
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Katılımcı eklendi!');
      setIdNo('');
      setFirstName('');
      setLastName('');
      setContact('');
      setShowAddForm(false);
      loadData();
    } catch (error) {
      console.error('Ekleme hatası:', error);
      toast.error(error.response?.data?.detail || 'Katılımcı eklenemedi');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/draws/${drawId}/participants/upload`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      );

      toast.success(`${response.data.added} katılımcı eklendi!`);
      if (response.data.duplicates > 0) {
        toast.info(`${response.data.duplicates} tekrarlı kayıt atlandı`);
      }
      loadData();
    } catch (error) {
      console.error('Yükleme hatası:', error);
      toast.error(error.response?.data?.detail || 'Dosya yüklenemedi');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!window.confirm('Bu katılımcıyı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/draws/${drawId}/participants/${participantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Katılımcı silindi');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Katılımcı silinemedi');
    }
  };

  const handleExecuteDraw = async () => {
    if (!window.confirm('Çekilişi başlatmak istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    setExecuting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/draws/${drawId}/execute`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Çekiliş tamamlandı!');
      navigate(`/cekilis/${drawId}/sonuclar`);
    } catch (error) {
      console.error('Çekiliş hatası:', error);
      toast.error(error.response?.data?.detail || 'Çekiliş yapılamadı');
    } finally {
      setExecuting(false);
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

  if (!draw) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Çekiliş bulunamadı</p>
        </div>
      </Layout>
    );
  }

  const canExecute = participants.length >= (draw.main_count + draw.backup_count);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/cekilis')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800" data-testid="draw-detail-title">
              {draw.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600 mt-2">
              <span>Asıl: {draw.main_count}</span>
              <span>•</span>
              <span>Yedek: {draw.backup_count}</span>
              <span>•</span>
              <span>Katılımcı: {participants.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Card className="shadow-md">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3">
              {draw.status !== 'completed' && (
                <>
                  <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="add-participant-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Manuel Ekle
                  </Button>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Button
                      as="span"
                      disabled={uploading}
                      className="bg-amber-500 hover:bg-amber-600"
                      data-testid="upload-excel-button"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Excel Yükle'}
                    </Button>
                  </label>

                  <Button
                    onClick={handleExecuteDraw}
                    disabled={!canExecute || executing}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 ml-auto"
                    data-testid="execute-draw-button"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {executing ? 'Çekiliş yapılıyor...' : 'Çekilişi Başlat'}
                  </Button>
                </>
              )}
              
              {draw.status === 'completed' && (
                <Button
                  onClick={() => navigate(`/cekilis/${drawId}/sonuclar`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Sonuçları Görüntüle
                </Button>
              )}
            </div>

            {!canExecute && draw.status !== 'completed' && (
              <p className="text-amber-600 text-sm mt-4">
                * Çekiliş için en az {draw.main_count + draw.backup_count} katılımcı gerekli. 
                Eksik: {(draw.main_count + draw.backup_count) - participants.length}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Add Form */}
        {showAddForm && draw.status !== 'completed' && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Katılımcı Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddParticipant} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="ID No"
                  value={idNo}
                  onChange={(e) => setIdNo(e.target.value)}
                  data-testid="participant-id-input"
                />
                <Input
                  placeholder="Ad"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="participant-firstname-input"
                />
                <Input
                  placeholder="Soyad"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="participant-lastname-input"
                />
                <Input
                  placeholder="İletişim"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  data-testid="participant-contact-input"
                />
                <Button type="submit" className="bg-green-600 hover:bg-green-700 md:col-span-4">
                  Ekle
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Participants Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Katılımcılar ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Henüz katılımcı eklenmemiş</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-gray-600 font-medium">#</th>
                      <th className="text-left p-3 text-gray-600 font-medium">ID No</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Ad</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Soyad</th>
                      <th className="text-left p-3 text-gray-600 font-medium">İletişim</th>
                      {draw.status !== 'completed' && (
                        <th className="text-left p-3 text-gray-600 font-medium">İşlem</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, index) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-gray-500">{index + 1}</td>
                        <td className="p-3 font-mono text-gray-800">{p.id_no}</td>
                        <td className="p-3 text-gray-800">{p.first_name}</td>
                        <td className="p-3 text-gray-800">{p.last_name}</td>
                        <td className="p-3 text-gray-600">{p.contact}</td>
                        {draw.status !== 'completed' && (
                          <td className="p-3">
                            <Button
                              onClick={() => handleDeleteParticipant(p.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DrawDetailPage;
