import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy, Users, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DrawsListPage = () => {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDraws();
  }, []);

  const loadDraws = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/draws`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDraws(response.data);
    } catch (error) {
      console.error('Çekilişler yüklenemedi:', error);
      toast.error('Çekilişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraw = async (e, drawId) => {
    e.stopPropagation();
    if (!window.confirm('Bu çekilişi silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/draws/${drawId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Çekiliş silindi');
      loadDraws();
    } catch (error) {
      toast.error('Çekiliş silinemedi');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1" data-testid="draws-title">
              Çekiliş Havuzu
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Profesyonel çekiliş yönetim sistemi
            </p>
          </div>
          <Button
            onClick={() => navigate('/cekilis/olustur')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            data-testid="create-draw-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Çekiliş
          </Button>
        </div>

        {/* Draws Grid */}
        {draws.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz çekiliş oluşturulmamış</h3>
            <p className="text-gray-600 mb-6">Yeni bir çekiliş oluşturarak başlayın</p>
            <Button
              onClick={() => navigate('/cekilis/olustur')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Çekilişi Oluştur
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draws.map((draw) => (
              <div
                key={draw.id}
                onClick={() => navigate(`/cekilis/${draw.id}`)}
                className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
                data-testid={`draw-card-${draw.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{draw.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(draw.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      draw.status === 'completed'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {draw.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteDraw(e, draw.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Katılımcı</span>
                    </div>
                    <span className="font-semibold text-gray-800">{draw.participant_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <Trophy className="w-4 h-4" />
                      <span>Asıl Talihli</span>
                    </div>
                    <span className="font-semibold text-green-600">{draw.main_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Trophy className="w-4 h-4" />
                      <span>Yedek Talihli</span>
                    </div>
                    <span className="font-semibold text-amber-600">{draw.backup_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DrawsListPage;
