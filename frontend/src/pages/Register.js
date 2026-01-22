import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft, Mail, CheckCircle, XCircle, FileText, ScrollText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = '/ekos-logo.png';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    firma_adi: '',
    // New profile fields
    ad: '',
    soyad: '',
    sehir: '',
    dogum_tarihi: '',
    profil_resmi: '',
    telefon: '',
  });
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showFirmaNotFoundDialog, setShowFirmaNotFoundDialog] = useState(false);
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementContent, setAgreementContent] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Fetch user agreement on mount
  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/ayarlar/kullanici-sozlesmesi`);
        setAgreementContent(response.data.content || '');
      } catch (error) {
        console.error('Kullanıcı sözleşmesi yüklenemedi');
      }
    };
    fetchAgreement();
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!agreementAccepted) {
      toast.error('Devam etmek için kullanıcı sözleşmesini kabul etmelisiniz');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        ...formData,
        role: 'viewer',
      });

      setRegisteredEmail(formData.email);
      toast.success('Kayıt başarılı! Lütfen email adresinizi doğrulayın.');
      setShowVerificationDialog(true);
    } catch (error) {
      if (error.response?.data?.detail === 'FIRMA_NOT_FOUND') {
        setShowFirmaNotFoundDialog(true);
      } else {
        toast.error(error.response?.data?.detail || 'Kayıt başarısız');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyingCode(true);
    try {
      await axios.post(`${API}/auth/verify-email`, {
        email: registeredEmail,
        code: verificationCode,
      });

      toast.success('Email doğrulandı! Giriş yapabilirsiniz.');
      setShowVerificationDialog(false);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Doğrulama başarısız');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await axios.post(`${API}/auth/resend-code`, { email: registeredEmail });
      toast.success('Doğrulama kodu yeniden gönderildi');
    } catch (error) {
      toast.error('Kod gönderilemedi');
    }
  };

  const handleSkipVerification = () => {
    setShowVerificationDialog(false);
    toast.info('Email doğrulamasını daha sonra yapabilirsiniz');
    navigate('/login');
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

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Desktop Header - EKOS Title above form */}
          <div className="hidden lg:block text-center mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: '#1e40af' }}>
              EKOS
            </h1>
            <p className="text-base italic" style={{ color: '#3b82f6' }}>Yeni hesap oluştur</p>
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
            <p className="text-base italic" style={{ color: '#3b82f6' }}>Yeni hesap oluştur</p>
          </div>

          {/* Register Card */}
          <Card className="glass-effect border-0 shadow-2xl animate-fade-in" data-testid="register-card">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1e40af' }}>
                <UserPlus className="w-6 h-6 text-blue-700" />
                Kayıt Ol
              </CardTitle>
              <CardDescription className="text-gray-600">
                Yeni bir hesap oluşturmak için bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="font-medium" style={{ color: '#1e40af' }}>Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="kullaniciadi"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    data-testid="username-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium" style={{ color: '#1e40af' }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    data-testid="email-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ad" className="font-medium" style={{ color: '#1e40af' }}>Ad</Label>
                    <Input
                      id="ad"
                      type="text"
                      placeholder="Adınız"
                      value={formData.ad}
                      onChange={(e) => handleChange('ad', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      data-testid="ad-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soyad" className="font-medium" style={{ color: '#1e40af' }}>Soyad</Label>
                    <Input
                      id="soyad"
                      type="text"
                      placeholder="Soyadınız"
                      value={formData.soyad}
                      onChange={(e) => handleChange('soyad', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      data-testid="soyad-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sehir" className="font-medium" style={{ color: '#1e40af' }}>Şehir</Label>
                    <Input
                      id="sehir"
                      type="text"
                      placeholder="Yaşadığınız şehir"
                      value={formData.sehir}
                      onChange={(e) => handleChange('sehir', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      data-testid="sehir-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dogum_tarihi" className="font-medium" style={{ color: '#1e40af' }}>Doğum Tarihi</Label>
                    <Input
                      id="dogum_tarihi"
                      type="date"
                      value={formData.dogum_tarihi}
                      onChange={(e) => handleChange('dogum_tarihi', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      data-testid="dogum-tarihi-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefon" className="font-medium" style={{ color: '#1e40af' }}>Cep Telefonu</Label>
                  <Input
                    id="telefon"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={formData.telefon}
                    onChange={(e) => handleChange('telefon', e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    data-testid="telefon-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firma_adi" className="font-medium" style={{ color: '#1e40af' }}>Firma Adı *</Label>
                  <Input
                    id="firma_adi"
                    type="text"
                    placeholder="Çalıştığınız firma adını girin"
                    value={formData.firma_adi}
                    onChange={(e) => handleChange('firma_adi', e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    data-testid="firma-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    * Firma adı EKOS sisteminde kayıtlı olmalıdır
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium" style={{ color: '#1e40af' }}>Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    minLength={6}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    data-testid="password-input"
                  />
                  <p className="text-xs text-gray-500">En az 6 karakter olmalıdır</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirm" className="font-medium" style={{ color: '#1e40af' }}>Şifre Tekrar</Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password_confirm}
                    onChange={(e) => handleChange('password_confirm', e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    data-testid="password-confirm-input"
                  />
                </div>

                {/* User Agreement Checkbox */}
                <div className="flex items-start space-x-2 py-2">
                  <Checkbox
                    id="agreement"
                    checked={agreementAccepted}
                    onCheckedChange={(checked) => setAgreementAccepted(checked)}
                    className="mt-1"
                    data-testid="agreement-checkbox"
                  />
                  <div className="text-sm">
                    <label htmlFor="agreement" className="text-gray-600 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setShowAgreementDialog(true)}
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Kullanıcı Sözleşmesi
                      </button>
                      'ni okudum ve kabul ediyorum *
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-md"
                  disabled={loading || !agreementAccepted}
                  data-testid="register-button"
                >
                  {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </Button>
              </form>

              {/* Login Link */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Zaten hesabınız var mı?</p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-700 hover:bg-blue-50"
                    onClick={() => navigate('/login')}
                    data-testid="login-link-button"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Giriş Yap
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

      {/* Email Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md" data-testid="verification-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Email Doğrulama
            </DialogTitle>
            <DialogDescription>
              <strong>{registeredEmail}</strong> adresine bir doğrulama kodu gönderdik. Lütfen kodu aşağıya girin.
              <br />
              <span className="text-xs text-amber-600 mt-2 block">
                Not: Demo modda kod backend loglarında görünür (Production'da email gönderilecek)
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Doğrulama Kodu</Label>
              <Input
                id="verification-code"
                placeholder="6 haneli kod"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                data-testid="verification-code-input"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              data-testid="resend-code-button"
            >
              Kodu Yeniden Gönder
            </Button>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSkipVerification}
              data-testid="skip-verification-button"
            >
              Daha Sonra
            </Button>
            <Button
              onClick={handleVerifyEmail}
              disabled={verifyingCode || verificationCode.length !== 6}
              className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700"
              data-testid="verify-button"
            >
              {verifyingCode ? 'Doğrulanıyor...' : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Doğrula
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Firma Not Found Dialog */}
      <Dialog open={showFirmaNotFoundDialog} onOpenChange={setShowFirmaNotFoundDialog}>
        <DialogContent className="sm:max-w-md text-center" data-testid="firma-not-found-dialog">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-red-600">
              Kayıt Yapılamadı
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="mb-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            </div>
            <p className="text-gray-700 text-lg mb-2">
              <strong>"{formData.firma_adi}"</strong> adlı firma
            </p>
            <p className="text-gray-600">
              EKOS sisteminde kayıtlı değil.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Lütfen firma adınızı kontrol edin veya sisteminizin yöneticisi ile iletişime geçin.
            </p>
          </div>
          <DialogFooter className="flex justify-center">
            <Button
              onClick={() => {
                setShowFirmaNotFoundDialog(false);
                navigate('/login');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              data-testid="firma-not-found-exit-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Giriş Sayfasına Dön
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Agreement Dialog */}
      <Dialog open={showAgreementDialog} onOpenChange={setShowAgreementDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" data-testid="agreement-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-amber-600" />
              Kullanıcı Sözleşmesi
            </DialogTitle>
            <DialogDescription>
              Kayıt olmadan önce lütfen aşağıdaki sözleşmeyi okuyun
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[50vh] overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 p-4 rounded-lg">
                {agreementContent || 'Kullanıcı sözleşmesi yükleniyor...'}
              </pre>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAgreementDialog(false)}
            >
              Kapat
            </Button>
            <Button
              onClick={() => {
                setAgreementAccepted(true);
                setShowAgreementDialog(false);
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Okudum, Kabul Ediyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;