"use client";

import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import api from '../services/api';

export default function Home() {
  const router = useRouter();

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const data = await api.postPublic('auth/google', { idToken: credentialResponse.credential });
      if (data.token) {
        localStorage.setItem('token', data.token);
        router.push('/home');
      } else {
        throw new Error('Token not provided by backend.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
    }
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

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="font-sans flex-grow w-full flex flex-col items-center justify-center p-8">
        <div className="chrome-card flex flex-col gap-8 p-10 w-full max-w-md text-samuel-off-white">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-samuel-bright-red to-samuel-dark-red flex items-center justify-center">
              <svg className="w-8 h-8 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
              RPG Login
            </h1>
            <p className="text-samuel-off-white/80 text-lg">
              Sign in with your Google account to continue your adventure
            </p>
          </div>
          <div className="flex justify-center">
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
    </GoogleOAuthProvider>
  );
}
