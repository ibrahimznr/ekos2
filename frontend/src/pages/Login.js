import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = '/ekos-logo.png';

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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #e8ecef 0%, #f0f4f8 50%, #e8ecef 100%)' }}>
      {/* Left Side - Logo Section (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #e8ecef 0%, #f0f4f8 100%)' }}>
        <div className="text-center">
          <img
            src={LOGO_URL}
            alt="EKOS Logo"
            className="w-full max-w-lg object-contain mx-auto"
            style={{ maxHeight: '70vh' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Desktop Header - EKOS Title above form */}
          <div className="hidden lg:block text-center mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: '#1e40af' }}>
              EKOS
            </h1>
            <p className="text-base italic" style={{ color: '#3b82f6' }}>Ekipman Kontrol Otomasyon Sistemi</p>
          </div>

          {/* Mobile Logo (shown only on mobile) */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-4">
              <img
                src={LOGO_URL}
                alt="EKOS Logo"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: '#1e40af' }}>
              EKOS
            </h1>
            <p className="text-base italic" style={{ color: '#3b82f6' }}>Ekipman Kontrol Otomasyon Sistemi</p>
          </div>

          {/* Login Card */}
          <Card className="glass-effect border-0 shadow-2xl animate-fade-in" data-testid="login-card">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1e40af' }}>
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
                  <Label htmlFor="email" className="font-medium" style={{ color: '#1e40af' }}>Email</Label>
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
                  <Label htmlFor="password" className="font-medium" style={{ color: '#1e40af' }}>Şifre</Label>
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

              {/* Register Link */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Hesabınız yok mu?</p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-700 hover:bg-blue-50"
                    onClick={() => navigate('/register')}
                    data-testid="register-link-button"
                  >
                    Kayıt Ol
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            © 2025 EKOS - Ekipman Kontrol Otomasyon Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;