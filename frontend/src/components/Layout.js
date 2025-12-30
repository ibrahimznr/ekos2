import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Shield, LogOut, Menu, X, Building2, Home, Settings, User } from 'lucide-react';
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

  const navItems = [];
  
  // Dashboard only for admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/', label: 'Dashboard', shortLabel: 'Ana', icon: LayoutDashboard });
  }
  
  // Raporlar for everyone
  navItems.push({ path: '/raporlar', label: 'Raporlar', shortLabel: 'Raporlar', icon: FileText });

  // İskele Bileşenleri - admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/iskele-bilesenleri', label: 'İskele', shortLabel: 'İskele', icon: Building2 });
  }

  // Admin panel only for admin
  if (user.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Yönetim', shortLabel: 'Yönetim', icon: Shield });
  }

  const isActive = (path) => location.pathname === path;

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex items-center justify-center">
                <img 
                  src={LOGO_URL} 
                  alt="EKOS Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = '<div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg flex items-center justify-center shadow-md"><span class="text-white font-bold text-xs sm:text-sm">EKOS</span></div>';
                  }}
                />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">EKOS</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Ekipman Kontrol Sistemi</p>
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
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{user.username || user.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-600">
                  {user.role === 'admin' ? 'Yönetici' : user.role === 'inspector' ? 'Müfettiş' : 'Görüntüleyici'}
                </p>
              </div>
              
              {/* Desktop Logout */}
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
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-3 py-3 space-y-1">
              {/* User Info on Mobile */}
              <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.username || user.email}</p>
                  <p className="text-xs text-gray-600">
                    {user.role === 'admin' ? 'Yönetici' : user.role === 'inspector' ? 'Müfettiş' : 'Görüntüleyici'}
                  </p>
                </div>
              </div>

              {/* Nav Items */}
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
                    className={`w-full justify-start h-12 ${isActive(item.path) 
                      ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                );
              })}

              {/* Logout Button */}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start h-12 mt-2 border-red-600 text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-bottom">
        <div className="flex justify-around items-center h-16 px-1 relative">
          {/* Sol taraftaki nav items (ilk 2) */}
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative ${
                  active 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : ''}`} />
                <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
                  {item.shortLabel}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-t-full" />
                )}
              </button>
            );
          })}
          
          {/* Ortadaki FAB - Yeni Rapor Butonu */}
          {(user.role === 'admin' || user.role === 'inspector') && (
            <div className="flex-1 flex items-center justify-center relative">
              <button
                onClick={() => {
                  // Navigate to raporlar and trigger modal
                  navigate('/raporlar', { state: { openNewRaporModal: true } });
                }}
                className="absolute -top-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg flex items-center justify-center text-white hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all border-4 border-white"
                style={{ boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' }}
              >
                <Plus className="h-7 w-7" />
              </button>
              <span className="text-xs text-gray-400 mt-6">Rapor</span>
            </div>
          )}
          
          {/* Sağ taraftaki nav items (sonraki 2) */}
          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative ${
                  active 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : ''}`} />
                <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
                  {item.shortLabel}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-t-full" />
                )}
              </button>
            );
          })}
          
          {/* Çıkış butonu */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs mt-1">Çıkış</span>
          </button>
        </div>
      </nav>

      {/* Footer - Hidden on mobile */}
      <footer className="hidden md:block bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            © 2025 EKOS - Ekipman Kontrol Otomasyon Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
