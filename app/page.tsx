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
      <div 
        className="font-sans flex-grow w-full flex flex-col items-center justify-center"
      >
        <div 
          className="flex flex-col gap-6 p-8 rounded-lg shadow-xl w-full max-w-md"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
        >
          <h1 className="text-3xl font-bold text-center">RPG Login</h1>
          <p className="text-center">Sign in with your Google account to continue</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              theme="filled_black"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
