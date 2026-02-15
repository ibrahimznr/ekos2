import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, FileText, Shield, LogOut, Menu, X, Building2, User, Plus, ChevronLeft, ChevronRight, Settings, Truck, Trophy, BookOpen, Brain, ChevronDown, Bell, Calendar, Clock, UserCircle, MessageSquare, Send, Check, CheckCheck, Trash2, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import LanguageSelector from '@/components/LanguageSelector';

const LOGO_URL = '/ekos-logo.png';

const Layout = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [cekilisOpen, setCekilisOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Notification states
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [selectedNotification, setSelectedNotification] = React.useState(null);
  const [showNotificationDetail, setShowNotificationDetail] = React.useState(false);

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState('');
  const [sendingFeedback, setSendingFeedback] = React.useState(false);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notifResponse.data);
      setUnreadCount(countResponse.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Update time every minute and fetch notifications
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Fetch notifications on mount and every 30 seconds
    fetchNotifications();
    const notifTimer = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(notifTimer);
    };
  }, [fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
      setShowNotificationDetail(false);
    } catch (error) {
      toast.error('Bildirim silinemedi');
    }
  };

  // View notification detail
  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetail(true);
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
  };

  // Send feedback
  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast.error('Lütfen bir mesaj yazın');
      return;
    }

    setSendingFeedback(true);
    try {
      await api.post('/notifications/feedback', { message: feedbackMessage });
      toast.success('Geri bildiriminiz gönderildi');
      setShowFeedbackModal(false);
      setFeedbackMessage('');
    } catch (error) {
      toast.error('Geri bildirim gönderilemedi');
    } finally {
      setSendingFeedback(false);
    }
  };

  // Format date in Turkish
  const formatDate = (date) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  // Format notification date
  const formatNotificationDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_user': return <User className="h-4 w-4 text-green-600" />;
      case 'feedback': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'message': return <Mail className="h-4 w-4 text-purple-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors during logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success(t('auth.logoutSuccess'));
    navigate('/login');
  };

  const navItems = [];

  // Dashboard only for admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/', label: t('nav.dashboard'), shortLabel: 'Ana', icon: LayoutDashboard });
  }

  // Raporlar for everyone
  navItems.push({ path: '/raporlar', label: t('nav.reports'), shortLabel: 'Raporlar', icon: FileText });

  // İskele Bileşenleri - admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/iskele-bilesenleri', label: t('nav.scaffoldComponents'), shortLabel: 'İskele', icon: Building2 });
  }

  // Makineler - admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/makineler', label: t('nav.machines'), shortLabel: 'Makineler', icon: Truck });
  }

  // Cephe İskeleleri - admin and inspector
  if (user.role === 'admin' || user.role === 'inspector') {
    navItems.push({ path: '/cephe-iskeleleri', label: t('nav.facadeScaffolding'), shortLabel: 'Cephe', icon: Building2 });
  }

  // Admin panel only for admin
  if (user.role === 'admin') {
    navItems.push({ path: '/admin', label: t('nav.adminPanel'), shortLabel: 'Yönetim', icon: Shield });
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

          {/* Çekiliş Dropdown */}
          <div className="pt-2 border-t border-gray-200 mt-2">
            <button
              onClick={() => setCekilisOpen(!cekilisOpen)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                location.pathname.startsWith('/cekilis') || location.pathname === '/kelime-havuzu' || location.pathname === '/zeka-oyunu'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
              title={!sidebarOpen ? 'Çekiliş' : ''}
              data-testid="nav-cekilis"
            >
              <Trophy className={`h-5 w-5 flex-shrink-0 ${
                location.pathname.startsWith('/cekilis') || location.pathname === '/kelime-havuzu' || location.pathname === '/zeka-oyunu'
                  ? 'text-white' : 'text-purple-500'
              }`} />
              {sidebarOpen && (
                <>
                  <span className="font-medium flex-1 text-left">{t('nav.raffle')}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${cekilisOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Submenu */}
            {sidebarOpen && cekilisOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => navigate('/cekilis')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/cekilis'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="nav-cekilis-havuzu"
                >
                  <Trophy className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{t('nav.rafflePool')}</span>
                </button>
                <button
                  onClick={() => navigate('/kelime-havuzu')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/kelime-havuzu'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="nav-kelime-havuzu"
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{t('nav.vocabularyPool')}</span>
                </button>
                <button
                  onClick={() => navigate('/zeka-oyunu')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/zeka-oyunu'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="nav-zeka-oyunu"
                >
                  <Brain className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{t('nav.mindGames')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Settings Button */}
        <div className="px-3 pb-1">
          <button
            onClick={() => navigate('/ayarlar')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive('/ayarlar')
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
            title={!sidebarOpen ? t('nav.settings') : ''}
            data-testid="nav-ayarlar"
          >
            <Settings className={`h-5 w-5 flex-shrink-0 ${isActive('/ayarlar') ? 'text-white' : 'text-gray-500'}`} />
            {sidebarOpen && <span className="font-medium">{t('nav.settings')}</span>}
          </button>
        </div>

        {/* Language Selector */}
        <div className="px-3 pb-1">
          {sidebarOpen ? (
            <div className="flex items-center justify-center">
              <LanguageSelector variant="default" />
            </div>
          ) : (
            <div className="flex justify-center">
              <LanguageSelector variant="minimal" />
            </div>
          )}
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
                  {user.role === 'admin' ? t('auth.manager') : user.role === 'inspector' ? 'Inspector' : 'Viewer'}
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
            title={!sidebarOpen ? t('auth.logout') : ''}
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">{t('auth.logout')}</span>}
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

              {/* Çekiliş Section */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <p className="px-3 py-1 text-xs font-semibold text-purple-600 uppercase">Çekiliş</p>
                <Button
                  variant={location.pathname === '/cekilis' ? 'default' : 'ghost'}
                  onClick={() => {
                    navigate('/cekilis');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start h-12 ${location.pathname === '/cekilis'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  Çekiliş Havuzu
                </Button>
                <Button
                  variant={location.pathname === '/kelime-havuzu' ? 'default' : 'ghost'}
                  onClick={() => {
                    navigate('/kelime-havuzu');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start h-12 ${location.pathname === '/kelime-havuzu'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <BookOpen className="h-5 w-5 mr-3" />
                  İngilizce Kelime Havuzu
                </Button>
                <Button
                  variant={location.pathname === '/zeka-oyunu' ? 'default' : 'ghost'}
                  onClick={() => {
                    navigate('/zeka-oyunu');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start h-12 ${location.pathname === '/zeka-oyunu'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Brain className="h-5 w-5 mr-3" />
                  Zeka Oyunları
                </Button>
              </div>

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
        
        {/* Desktop Sticky Header */}
        <header className={`hidden md:flex sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm h-14 items-center justify-between px-6`}>
          {/* Left side - Date and Time */}
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{formatDate(currentTime)}</span>
          </div>

          {/* Right side - Notifications, Admin Panel, User */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button 
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Bildirimler"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {/* Notification badge - can be dynamic later */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Admin Panel Link - Only for admin */}
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Yönetim Paneli"
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Yönetim Paneli</span>
              </button>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.username || user.email?.split('@')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{user.username || user.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {user.role === 'admin' ? 'Yönetici' : user.role === 'inspector' ? 'Müfettiş' : 'Görüntüleyici'}
                  </p>
                </div>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate('/ayarlar')}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profil Ayarları
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate('/ayarlar')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Hesap Bilgileri
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

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
