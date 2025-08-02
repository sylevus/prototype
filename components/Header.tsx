'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasAdministratorRole, isTokenValid } from '@/utils/auth';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tokenChanged', handleTokenChange);

    // Check auth state periodically to handle token expiration
    const interval = setInterval(checkAuthState, 60000); // Check every minute

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenChanged', handleTokenChange);
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
    <header className="chrome-header text-samuel-off-white p-6 flex justify-between items-center sticky top-0 z-50">
      <Link 
        href={isLoggedIn ? "/home" : "/"} 
        className="text-2xl font-bold hover:text-samuel-bright-red transition-all duration-300 tracking-wide hover:scale-105"
      >
        <span className="bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
          RPG Character Creator
        </span>
      </Link>
      <nav className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            <Link 
              href="/subscription" 
              className="chrome-button-secondary text-samuel-off-white py-2 px-6 inline-block text-sm"
            >
              Subscription
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="chrome-button-secondary text-samuel-off-white py-2 px-6 inline-block text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-500"
              >
                🛡️ Admin
              </Link>
            )}
            <button onClick={handleLogout} className="chrome-button text-samuel-off-white py-3 px-8">
              Logout
            </button>
          </>
        ) : (
          <Link href="/" className="chrome-button text-samuel-off-white py-3 px-8 inline-block">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
