import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Shield, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_e367b8d0-918c-4b70-9385-6b8d91452ae9/artifacts/v8wd60u8_Firefly_Gemini%20Flash_I%20designed%20a%20web%20application.%20I%20am%20a%20periodic%20checkup%20specialist.%20I%20record%20the%20equipm%20731040.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Çıkış yapıldı');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/raporlar', label: 'Raporlar', icon: FileText },
  ];

  if (user.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Yönetim', icon: Shield });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex items-center justify-center">
                <img 
                  src={LOGO_URL} 
                  alt="EKOS Logo" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg flex items-center justify-center shadow-md"><span class="text-white font-bold text-sm">EKOS</span></div>';
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800">EKOS</h1>
                <p className="text-xs text-gray-600">Ekipman Kontrol Otomasyon Sistemi</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    onClick={() => navigate(item.path)}
                    className={isActive(item.path) 
                      ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100'}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800">{user.username || user.email}</p>
                <p className="text-xs text-gray-600">
                  {user.role === 'admin' ? 'Yönetici' : user.role === 'inspector' ? 'Müfettiş' : 'Görüntüleyici'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-600 text-red-700 hover:bg-red-50 hidden md:flex"
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white" data-testid="mobile-menu">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white'
                        : 'text-gray-700'
                    }`}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start border-red-600 text-red-700 hover:bg-red-50"
                data-testid="mobile-logout-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 EKOS - Ekipman Kontrol Otomasyon Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;