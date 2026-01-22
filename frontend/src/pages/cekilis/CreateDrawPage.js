import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateDrawPage = () => {
  const [name, setName] = useState('');
  const [mainCount, setMainCount] = useState(5);
  const [backupCount, setBackupCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Çekiliş adı gerekli');
      return;
    }

    if (mainCount < 1 || backupCount < 0) {
      toast.error('Geçersiz sayılar');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/draws`, {
        name: name.trim(),
        main_count: mainCount,
        backup_count: backupCount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Çekiliş oluşturuldu!');
      navigate(`/cekilis/${response.data.id}`);
    } catch (error) {
      console.error('Çekiliş oluşturma hatası:', error);
      toast.error(error.response?.data?.detail || 'Çekiliş oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800" data-testid="create-draw-title">
              Yeni Çekiliş Oluştur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çekiliş Adı
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Yılbaşı Çekilişi 2025"
                  data-testid="draw-name-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Asıl Talihli Sayısı
                  </label>
                  <Input
                    type="number"
                    value={mainCount}
                    onChange={(e) => setMainCount(parseInt(e.target.value) || 0)}
                    min="1"
                    max="1000"
                    className="border-green-200 focus:border-green-500"
                    data-testid="main-count-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kazanan kişi sayısı</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">
                    Yedek Talihli Sayısı
                  </label>
                  <Input
                    type="number"
                    value={backupCount}
                    onChange={(e) => setBackupCount(parseInt(e.target.value) || 0)}
                    min="0"
                    max="1000"
                    className="border-amber-200 focus:border-amber-500"
                    data-testid="backup-count-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Yedek kişi sayısı</p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-6"
                  data-testid="submit-draw-button"
                >
                  {loading ? 'Oluşturuluyor...' : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Çekiliş Oluştur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateDrawPage;
