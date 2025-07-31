'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className="chrome-header text-samuel-off-white p-6 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="text-2xl font-bold hover:text-samuel-bright-red transition-all duration-300 tracking-wide hover:scale-105">
        <span className="bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
          RPG Character Creator
        </span>
      </Link>
      <nav>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="chrome-button text-samuel-off-white py-3 px-8">
            Logout
          </button>
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
