import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useUser, useAuth } from '../hooks/useAuth';
import { Avatar, AvatarFallback } from './ui/Avatar';
import { Button } from './ui/Button';

export default function UserProfile() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await signOut();
      if (!error) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  if (!user) return null;

  const userInitials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-500 mt-1">
              {user.user_metadata?.full_name || 'User'}
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
