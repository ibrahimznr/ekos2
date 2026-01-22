import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Shield, LogOut, Menu, X, Building2, User, Plus, ChevronLeft, ChevronRight, Settings, Truck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

const LOGO_URL = '/ekos-logo.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors during logout
    }
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
    navItems.push({ path: '/iskele-bilesenleri', label: 'İskele Bileşenleri', shortLabel: 'İskele', icon: Building2 });
  }

  // Makineler - admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/makineler', label: 'Makineler', shortLabel: 'Makineler', icon: Truck });
  }

  // Cephe İskeleleri - admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/cephe-iskeleleri', label: 'Cephe İskeleleri', shortLabel: 'Cephe', icon: Building2 });
  }

  // Admin panel only for admin
  if (user.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Yönetim Paneli', shortLabel: 'Yönetim', icon: Shield });
  }

  const isActive = (path) => location.pathname === path;

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)' }}>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white shadow-xl border-r border-gray-200 fixed left-0 top-0 h-full z-40 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo Section */}
        <div className={`flex items-center gap-3 p-4 border-b border-gray-200 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
            <img
              src={LOGO_URL}
              alt="EKOS Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentElement.innerHTML = '<div class="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg flex items-center justify-center shadow-md"><span class="text-white font-bold text-sm">EK</span></div>';
              }}
            />
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-800">EKOS</h1>
              <p className="text-xs text-gray-500 truncate">Ekipman Kontrol Sistemi</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${active
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                  } ${!sidebarOpen ? 'justify-center' : ''}`}
                title={!sidebarOpen ? item.label : ''}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
                {sidebarOpen && (
                  <span className={`font-medium ${active ? '' : ''}`}>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings Button */}
        <div className="px-3 pb-1">
          <button
            onClick={() => navigate('/ayarlar')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive('/ayarlar')
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
            title={!sidebarOpen ? 'Ayarlar' : ''}
            data-testid="nav-ayarlar"
          >
            <Settings className={`h-5 w-5 flex-shrink-0 ${isActive('/ayarlar') ? 'text-white' : 'text-gray-500'}`} />
            {sidebarOpen && <span className="font-medium">Ayarlar</span>}
          </button>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.username || user.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin' ? 'Yönetici' : user.role === 'inspector' ? 'Müfettiş' : 'Görüntüleyici'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center" title={user.username || user.email}>
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
            title={!sidebarOpen ? 'Çıkış Yap' : ''}
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex justify-between items-center h-14 px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img
              src={LOGO_URL}
              alt="EKOS Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentElement.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-xs">EK</span></div>';
              }}
            />
            <h1 className="text-lg font-bold text-gray-800">EKOS</h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border-t border-gray-100 shadow-lg">
            <div className="px-3 py-3 space-y-1">
              {/* User Info */}
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

              {/* Settings Button */}
              <Button
                variant={isActive('/ayarlar') ? 'default' : 'ghost'}
                onClick={() => {
                  navigate('/ayarlar');
                  setMobileMenuOpen(false);
                }}
                className={`w-full justify-start h-12 ${isActive('/ayarlar')
                  ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Settings className="h-5 w-5 mr-3" />
                Ayarlar
              </Button>

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
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-14 md:mt-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="hidden md:block bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-600">
              © 2025 EKOS - Ekipman Kontrol Otomasyon Sistemi. Tüm hakları saklıdır.
            </p>
          </div>
        </footer>
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
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative ${active
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
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative ${active
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
    </div>
  );
};

export default Layout;
