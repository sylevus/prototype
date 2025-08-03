'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasAdministratorRole, isTokenValid } from '@/utils/auth';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const checkAuthState = () => {
    const token = localStorage.getItem('token');
    const validToken = token && isTokenValid(token);
    setIsLoggedIn(!!validToken);
    
    if (validToken) {
      setIsAdmin(hasAdministratorRole(token));
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Check auth state on mount
    checkAuthState();

    // Listen for storage changes (including when token is set/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuthState();
      }
    };

    // Listen for custom token change events
    const handleTokenChange = () => {
      checkAuthState();
    };

    // Close menu when clicking outside
    const handleClickOutside = () => {
      setShowMenu(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tokenChanged', handleTokenChange);
    window.addEventListener('click', handleClickOutside);

    // Check auth state periodically to handle token expiration
    const interval = setInterval(checkAuthState, 60000); // Check every minute

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenChanged', handleTokenChange);
      window.removeEventListener('click', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    // Clear the JWT token
    localStorage.removeItem('token');
    
    // Clear any other auth-related data
    localStorage.removeItem('user');
    localStorage.removeItem('player');
    
    // Update local state
    setIsLoggedIn(false);
    setIsAdmin(false);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tokenChanged'));
    
    // Redirect to login page
    router.push('/');
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
      <Link 
        href={isLoggedIn ? "/home" : "/"} 
        className="chrome-surface p-2 rounded-lg backdrop-blur-md hover:bg-samuel-dark-red/20 transition-all duration-300"
      >
        <span className="text-sm font-bold bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
          RPG Creator
        </span>
      </Link>
      
      <div className="relative">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="chrome-surface p-2 rounded-lg backdrop-blur-md hover:bg-samuel-dark-red/20 transition-all duration-300 text-samuel-off-white"
          title="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Hamburger Menu */}
        {showMenu && (
          <div className="absolute right-0 top-12 chrome-card-fantasy p-2 min-w-[150px]" onClick={(e) => e.stopPropagation()}>
            {isLoggedIn ? (
              <>
                <Link 
                  href="/subscription" 
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-samuel-dark-red/20 transition-all duration-300 text-sm text-samuel-off-white w-full"
                  onClick={() => setShowMenu(false)}
                >
                  💳 Subscription
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-600/20 transition-all duration-300 text-sm text-samuel-off-white border-l-2 border-red-500/50 w-full"
                    onClick={() => setShowMenu(false)}
                  >
                    🛡️ Admin
                  </Link>
                )}
                <button 
                  onClick={() => { handleLogout(); setShowMenu(false); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-samuel-dark-red/20 transition-all duration-300 text-sm text-samuel-off-white w-full text-left"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <Link 
                href="/" 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-samuel-dark-red/20 transition-all duration-300 text-sm text-samuel-off-white w-full"
                onClick={() => setShowMenu(false)}
              >
                🔑 Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
