import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Home, Search, PlusCircle, Clock, User, Bell, MapPin } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { notificationService } from '../services/notificationService';
import { useRideStore } from '../stores/useRideStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { role } = useRideStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notificationService.getUnreadCount());
    const unsubscribe = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });
    return unsubscribe;
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
      isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'
    }`;

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg">
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PathMate</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(true)}
            className="relative text-white hover:bg-indigo-500 hover:text-white rounded-full"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute top-1 right-1 w-4 h-4 p-0 text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
          <span className="text-xs bg-indigo-500 px-2 py-1 rounded-full">{role}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="rounded-full p-0 h-8 w-8 hover:bg-indigo-300"
          >
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarFallback className="bg-indigo-400 text-sm font-bold text-white">JD</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around p-2 z-50">
        <NavLink to="/" className={navLinkClass} end>
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/search" className={navLinkClass}>
          <Search className="w-5 h-5" />
          <span className="text-[9px] font-medium">Search</span>
        </NavLink>
        <NavLink to="/post" className={navLinkClass}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px] font-medium">Post</span>
        </NavLink>
        <NavLink to="/history" className={navLinkClass}>
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-medium">History</span>
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          <User className="w-5 h-5" />
          <span className="text-[9px] font-medium">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
