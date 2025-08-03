"use client";

import { useState, useEffect } from 'react';
import { hasAdministratorRole } from '../../utils/auth';
import api from '../../services/api';

interface ApiProvider {
  provider: number;
  displayName: string;
}

interface ApiProviderResponse {
  currentProvider: number;
  displayName: string;
  availableProviders: ApiProvider[];
}

export default function ApiProviderSelector() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ApiProviderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && hasAdministratorRole(token)) {
      setIsAdmin(true);
      loadCurrentProvider();
    }
  }, []);

  const loadCurrentProvider = async () => {
    try {
      const data = await api.getApiProvider();
      setCurrentProvider(data);
    } catch (error) {
      console.error('Failed to load API provider:', error);
    }
  };

  const handleProviderChange = async (providerId: number) => {
    setIsLoading(true);
    try {
      await api.setApiProvider(providerId);
      await loadCurrentProvider();
      setShowSelector(false);
    } catch (error) {
      console.error('Failed to set API provider:', error);
      alert('Failed to change API provider. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin || !currentProvider) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="chrome-surface p-2 rounded-lg backdrop-blur-md flex items-center gap-2 text-xs hover:bg-samuel-dark-red/20 transition-all duration-300"
        title="Click to change AI model (Admin only)"
      >
        <div className="w-2 h-2 bg-samuel-bright-red rounded-full mystic-glow"></div>
        <span className="text-samuel-off-white/80">AI: {currentProvider.displayName}</span>
        <svg 
          className={`w-3 h-3 text-samuel-off-white/60 transition-transform ${showSelector ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showSelector && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSelector(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 chrome-card-fantasy p-3 min-w-[200px] border border-samuel-bright-red/30">
            <div className="text-xs text-samuel-bright-red font-semibold mb-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Admin: AI Model
            </div>
            
            <div className="space-y-1">
              {currentProvider.availableProviders.map((provider) => (
                <button
                  key={provider.provider}
                  onClick={() => handleProviderChange(provider.provider)}
                  disabled={isLoading}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 flex items-center justify-between ${
                    provider.provider === currentProvider.currentProvider
                      ? 'bg-samuel-bright-red/30 text-samuel-off-white border border-samuel-bright-red/50'
                      : 'hover:bg-samuel-dark-red/20 text-samuel-off-white/80'
                  } disabled:opacity-50`}
                >
                  <span>{provider.displayName}</span>
                  {provider.provider === currentProvider.currentProvider && (
                    <div className="w-2 h-2 bg-samuel-bright-red rounded-full mystic-glow"></div>
                  )}
                </button>
              ))}
            </div>
            
            {isLoading && (
              <div className="mt-2 pt-2 border-t border-samuel-bright-red/20">
                <div className="text-xs text-samuel-off-white/60 flex items-center gap-2">
                  <div className="w-3 h-3 border border-samuel-bright-red border-t-transparent rounded-full animate-spin"></div>
                  Switching model...
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}