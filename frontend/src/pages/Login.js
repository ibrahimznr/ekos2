import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileCheck, Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Giriş başarılı!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)' }}>
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <FileCheck className="w-8 h-8 text-blue-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Ekipman Muayene Sistemi
          </h1>
          <p className="text-blue-100 text-base sm:text-lg">Rapor yönetim sistemi</p>
        </div>

        {/* Login Card */}
        <Card className="glass-effect border-0 shadow-2xl animate-fade-in" data-testid="login-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-700" />
              Giriş Yap
            </CardTitle>
            <CardDescription className="text-gray-600">
              Hesabınıza erişmek için bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  data-testid="email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  data-testid="password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-md"
                disabled={loading}
                data-testid="login-button"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-3 font-medium">Demo Hesap</p>
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-700"><span className="font-semibold">Email:</span> admin@ekipman.com</p>
                <p className="text-xs text-gray-700"><span className="font-semibold">Şifre:</span> admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          © 2025 Ekipman Muayene Sistemi. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
};

export default Login;