"use client";

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isTokenValid, getUserEmail } from '@/utils/auth';
import api from '../services/api';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isTokenValid(token)) {
      setIsLoggedIn(true);
      setUserEmail(getUserEmail(token));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const data = await api.postPublic('auth/google', { idToken: credentialResponse.credential });
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Dispatch custom event to notify header and other components
        window.dispatchEvent(new CustomEvent('tokenChanged'));
        
        router.push('/home');
      } else {
        throw new Error('Token not provided by backend.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('player');
    setIsLoggedIn(false);
    setUserEmail(null);
    
    // Dispatch custom event to notify header and other components
    window.dispatchEvent(new CustomEvent('tokenChanged'));
  };

  const goToHome = () => {
    router.push('/home');
  };

  const handleLoginError = () => {
    console.log('Login Failed');
    alert('Login failed. Please try again.');
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Google Client ID is not defined. Please check your .env.local file.");
    return <div>Error: Google Client ID is missing.</div>;
  }

  if (loading) {
    return (
      <div className="font-sans flex-grow w-full flex flex-col items-center justify-center p-8">
        <div className="text-samuel-off-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {isLoggedIn ? (
        // Already logged in - show welcome message and options
        <div className="font-sans flex-grow w-full flex flex-col items-center justify-center p-8">
          <div className="chrome-card flex flex-col gap-8 p-10 w-full max-w-md text-samuel-off-white">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
                Welcome Back!
              </h1>
              <p className="text-samuel-off-white/80 text-lg">
                You're already logged in as <span className="text-samuel-bright-red font-semibold">{userEmail}</span>
              </p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={goToHome}
                  className="chrome-button text-samuel-off-white py-3 px-8"
                >
                  Continue to Home
                </button>
                <button 
                  onClick={handleLogout}
                  className="chrome-button-secondary text-samuel-off-white py-2 px-6 border border-red-500 hover:bg-red-600/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Not logged in - show marketing landing page
        <div className="font-sans flex-grow w-full">
          {/* Hero Section */}
          <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(248,113,113,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(248,113,113,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(248,113,113,0.1),transparent_50%)]"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto text-center space-y-12">
              {/* Main Hero */}
              <div className="space-y-8">
                <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-samuel-off-white via-samuel-bright-red to-samuel-off-white bg-clip-text text-transparent leading-tight">
                  Create Epic
                  <br />
                  <span className="text-samuel-bright-red">RPG Characters</span>
                </h1>
                <p className="text-xl md:text-2xl text-samuel-off-white/80 max-w-3xl mx-auto leading-relaxed">
                  Bring your imagination to life with AI-powered character creation and immersive storytelling. 
                  Build detailed characters, explore rich narratives, and embark on unforgettable adventures.
                </p>
              </div>

              {/* Login CTA */}
              <div className="chrome-card p-8 max-w-md mx-auto">
                <div className="space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-samuel-bright-red to-samuel-dark-red flex items-center justify-center">
                    <svg className="w-8 h-8 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-samuel-off-white mb-2">Start Your Adventure</h3>
                    <p className="text-samuel-off-white/70 mb-6">Sign in with Google to begin creating your characters</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginError}
                      theme="filled_black"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-samuel-off-white mb-6">
                  Powered by <span className="text-samuel-bright-red">Advanced AI</span>
                </h2>
                <p className="text-xl text-samuel-off-white/70 max-w-3xl mx-auto">
                  Our cutting-edge AI helps you create rich, detailed characters with compelling backstories and immersive gameplay experiences.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="chrome-card p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-samuel-off-white mb-4">AI Character Creation</h3>
                  <p className="text-samuel-off-white/70">
                    Conversational AI guides you through creating detailed characters with rich personalities, backstories, and motivations.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="chrome-card p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8-1a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-samuel-off-white mb-4">Dynamic Storytelling</h3>
                  <p className="text-samuel-off-white/70">
                    Experience adaptive narratives that respond to your choices and character development in real-time.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="chrome-card p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-samuel-off-white mb-4">Complete Character Sheets</h3>
                  <p className="text-samuel-off-white/70">
                    Generate comprehensive character sheets with stats, inventory, and progression tracking for your campaigns.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Preview Section */}
          <section className="py-24 px-6 bg-gradient-to-b from-transparent to-black/20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-samuel-off-white mb-6">
                Start <span className="text-samuel-bright-red">Free</span>, Upgrade When Ready
              </h2>
              <p className="text-xl text-samuel-off-white/70 mb-12 max-w-2xl mx-auto">
                Begin your journey with our free tier, then unlock premium features for the ultimate RPG experience.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Free Tier */}
                <div className="chrome-card p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-samuel-off-white mb-2">Free</h3>
                    <div className="text-3xl font-bold text-samuel-bright-red mb-6">$0<span className="text-lg text-samuel-off-white/60">/month</span></div>
                    <ul className="text-left space-y-3 text-samuel-off-white/80 mb-8">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Basic character creation
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Limited AI interactions
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Character storage
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Premium Tier */}
                <div className="chrome-card p-8 border-2 border-samuel-bright-red relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-samuel-bright-red text-samuel-off-white px-4 py-1 text-sm font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-samuel-off-white mb-2">Premium</h3>
                    <div className="text-3xl font-bold text-samuel-bright-red mb-6">$9.99<span className="text-lg text-samuel-off-white/60">/month</span></div>
                    <ul className="text-left space-y-3 text-samuel-off-white/80 mb-8">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Unlimited character creation
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Advanced AI storytelling
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Character image generation
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Priority support
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}
