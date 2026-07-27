import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  Bell,
  CircleUserRound,
  GitMerge,
  House,
  MessageCircle,
  Route,
  Search,
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { UserRole } from '../types';
import { useRideStore } from '../stores/useRideStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { role, setRole } = useRideStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-700'
    }`;

  const toggleRole = () => {
    const nextRole = role === UserRole.DRIVER ? UserRole.RIDER : UserRole.DRIVER;
    setRole(nextRole);
    navigate(nextRole === UserRole.DRIVER ? '/post' : '/search');
  };

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col overflow-hidden border-x border-slate-200 bg-slate-50 shadow-2xl">
      <header className="border-b border-blue-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex min-h-11 items-center gap-2 rounded-xl pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Go to PathMate home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
              <GitMerge className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-[-0.03em] text-slate-950">PathMate</span>
              <span className="block text-[10px] font-semibold text-slate-500">Better routes, together</span>
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              onClick={toggleRole}
              className="h-9 rounded-full bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100"
            >
              {role === UserRole.DRIVER ? 'Driver' : 'Rider'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative h-10 w-10 rounded-full text-slate-600"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <Badge
                  variant="destructive"
                  className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center p-0 text-[9px]"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              ) : null}
            </Button>
          </div>
        </div>
      </header>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <main className="flex-1 overflow-y-auto p-4 pb-28">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">
        <NavLink to="/" className={navLinkClass} end>
          <House className="h-5 w-5" />
          <span>Home</span>
        </NavLink>
        <NavLink to={role === UserRole.DRIVER ? '/post' : '/search'} className={navLinkClass}>
          <Search className="h-5 w-5" />
          <span>{role === UserRole.DRIVER ? 'Offer' : 'Find'}</span>
        </NavLink>
        <NavLink to="/trips" className={navLinkClass}>
          <Route className="h-5 w-5" />
          <span>Trips</span>
        </NavLink>
        <NavLink to="/messages" className={navLinkClass}>
          <MessageCircle className="h-5 w-5" />
          <span>Messages</span>
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          <CircleUserRound className="h-5 w-5" />
          <span>Account</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
