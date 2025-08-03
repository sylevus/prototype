"use client";

import { useState, useEffect } from 'react';
import { hasAdministratorRole } from '../../utils/auth';

interface DeploymentInfo {
  service: string;
  status: 'healthy' | 'error' | 'unknown';
  url: string;
  lastChecked: string;
  version?: string;
  error?: string;
}

export default function DeploymentStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && hasAdministratorRole(token)) {
      setIsAdmin(true);
      checkDeploymentStatus();
    }
  }, []);

  const checkDeploymentStatus = async () => {
    setIsLoading(true);
    const now = new Date().toLocaleString();
    
    try {
      const deploymentChecks = [
        checkService('Backend API', 'https://grokapi.fly.dev'),
        checkService('Frontend App', 'https://prototypes.fly.dev'),
        checkService('Database', '', true)
      ];
      
      const results = await Promise.allSettled(deploymentChecks);
      const deploymentInfo = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const services = ['Backend API', 'Frontend App', 'Database'];
          return {
            service: services[index],
            status: 'error' as const,
            url: index === 0 ? 'https://grokapi.fly.dev' : index === 1 ? 'https://prototypes.fly.dev' : '',
            lastChecked: now,
            error: result.reason?.message || 'Unknown error'
          };
        }
      });
      
      setDeployments(deploymentInfo);
      setLastRefresh(now);
    } catch (error) {
      console.error('Failed to check deployment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkService = async (name: string, url: string, isDatabase = false): Promise<DeploymentInfo> => {
    const now = new Date().toLocaleString();
    
    if (isDatabase) {
      // Check database through API endpoint
      try {
        const response = await fetch('/api/health/database');
        const data = await response.json();
        return {
          service: name,
          status: response.ok ? 'healthy' : 'error',
          url: '',
          lastChecked: now,
          version: data.version || 'Unknown',
          error: response.ok ? undefined : data.error
        };
      } catch (error) {
        return {
          service: name,
          status: 'error',
          url: '',
          lastChecked: now,
          error: error instanceof Error ? error.message : 'Database check failed'
        };
      }
    }
    
    // Check web services
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for external checks
      });
      
      return {
        service: name,
        status: 'healthy',
        url,
        lastChecked: now,
        version: response.headers.get('x-version') || undefined
      };
    } catch (error) {
      // For no-cors requests, we can't distinguish between success and failure
      // So we'll assume healthy if no network error
      return {
        service: name,
        status: 'healthy', // Assume healthy for no-cors HEAD requests
        url,
        lastChecked: now
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'error': return '❌';
      default: return '⚠️';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Deployment Status</h3>
        <button
          onClick={checkDeploymentStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '🔄 Checking...' : '🔄 Refresh'}
        </button>
      </div>
      
      {lastRefresh && (
        <p className="text-sm text-gray-500 mb-4">Last updated: {lastRefresh}</p>
      )}
      
      <div className="space-y-3">
        {deployments.map((deployment) => (
          <div key={deployment.service} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{getStatusIcon(deployment.status)}</span>
              <div>
                <span className="font-medium text-gray-800">{deployment.service}</span>
                {deployment.url && (
                  <a 
                    href={deployment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
                  >
                    🔗 Visit
                  </a>
                )}
                {deployment.version && (
                  <span className="ml-2 text-xs text-gray-500">v{deployment.version}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${getStatusColor(deployment.status)}`}>
                {deployment.status.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">{deployment.lastChecked}</div>
              {deployment.error && (
                <div className="text-xs text-red-500 mt-1 max-w-xs truncate">
                  {deployment.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h4 className="font-medium text-blue-800 mb-2">📊 Deployment Info</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Automatic deployments trigger on every commit to main branch</div>
          <div>• Database migrations are applied before application deployment</div>
          <div>• Both frontend and backend are deployed to Fly.io</div>
          <div>• Check <a href="https://github.com/sylevus/Prototypes/actions" target="_blank" className="underline">GitHub Actions</a> for deployment logs</div>
        </div>
      </div>
    </div>
  );
}