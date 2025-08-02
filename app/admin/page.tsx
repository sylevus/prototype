'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAdministratorRole, getUserEmail, isTokenValid } from '@/utils/auth';
import { getSubscriptionDisplayName, getStatusDisplayName, getStatusColor, formatDate } from '@/utils/subscription';
import api from '@/services/api';

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminTestResult, setAdminTestResult] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token || !isTokenValid(token)) {
      router.push('/');
      return;
    }

    const adminRole = hasAdministratorRole(token);
    const email = getUserEmail(token);
    
    if (!adminRole) {
      router.push('/home');
      return;
    }

    setIsAdmin(adminRole);
    setUserEmail(email);
    setLoading(false);
  }, [router]);

  const testAdminEndpoint = async () => {
    try {
      const response = await api.get('auth/admin/test');
      setAdminTestResult(response);
    } catch (error: any) {
      setAdminTestResult({ error: error.message });
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('admin/subscription/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users');
    }
  };

  const grantFreeAccess = async (playerId: number, reason: string) => {
    try {
      setActionLoading(true);
      await api.post('admin/subscription/grant-free-access', { playerId, reason });
      alert('Free access granted successfully');
      await loadUsers();
    } catch (error: any) {
      alert(`Failed to grant free access: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const revokeFreeAccess = async (playerId: number, reason: string) => {
    try {
      setActionLoading(true);
      await api.post('admin/subscription/revoke-free-access', { playerId, reason });
      alert('Free access revoked successfully');
      await loadUsers();
    } catch (error: any) {
      alert(`Failed to revoke free access: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const suspendUser = async (playerId: number, reason: string) => {
    try {
      setActionLoading(true);
      await api.post('admin/subscription/suspend', { playerId, reason });
      alert('User suspended successfully');
      await loadUsers();
    } catch (error: any) {
      alert(`Failed to suspend user: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const reactivateUser = async (playerId: number) => {
    try {
      setActionLoading(true);
      await api.post('admin/subscription/reactivate', { playerId });
      alert('User reactivated successfully');
      await loadUsers();
    } catch (error: any) {
      alert(`Failed to reactivate user: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = (user: any, action: string) => {
    const reason = prompt(`Enter reason for ${action}:`);
    if (!reason) return;

    switch (action) {
      case 'grant':
        grantFreeAccess(user.playerId, reason);
        break;
      case 'revoke':
        revokeFreeAccess(user.playerId, reason);
        break;
      case 'suspend':
        suspendUser(user.playerId, reason);
        break;
      case 'reactivate':
        reactivateUser(user.playerId);
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen chrome-gradient flex items-center justify-center">
        <div className="text-samuel-off-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen chrome-gradient flex items-center justify-center">
        <div className="text-samuel-bright-red text-xl">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen chrome-gradient">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-samuel-off-white mb-2">
              Administrator Panel
            </h1>
            <p className="text-samuel-off-white/80">
              Logged in as: <span className="text-samuel-bright-red font-semibold">{userEmail}</span>
            </p>
          </div>

          {/* Admin Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* System Status Card */}
            <div className="chrome-panel p-6">
              <h2 className="text-xl font-semibold text-samuel-off-white mb-4">System Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-samuel-off-white/80">Backend API:</span>
                  <span className="text-green-400">Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-samuel-off-white/80">Database:</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-samuel-off-white/80">AI Service:</span>
                  <span className="text-green-400">Available</span>
                </div>
              </div>
            </div>

            {/* User Management Card */}
            <div className="chrome-panel p-6">
              <h2 className="text-xl font-semibold text-samuel-off-white mb-4">User Management</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowUserManagement(!showUserManagement);
                    if (!showUserManagement) loadUsers();
                  }}
                  className="w-full chrome-button text-samuel-off-white py-2 px-4 text-sm"
                >
                  {showUserManagement ? 'Hide Users' : 'View All Users'}
                </button>
                <button className="w-full chrome-button-secondary text-samuel-off-white py-2 px-4 text-sm">
                  Active Sessions
                </button>
                <button className="w-full chrome-button-secondary text-samuel-off-white py-2 px-4 text-sm">
                  Character Statistics
                </button>
              </div>
            </div>

            {/* System Tools Card */}
            <div className="chrome-panel p-6">
              <h2 className="text-xl font-semibold text-samuel-off-white mb-4">System Tools</h2>
              <div className="space-y-3">
                <button 
                  onClick={testAdminEndpoint}
                  className="w-full chrome-button text-samuel-off-white py-2 px-4 text-sm"
                >
                  Test Admin API
                </button>
                <button className="w-full chrome-button-secondary text-samuel-off-white py-2 px-4 text-sm">
                  View Logs
                </button>
                <button className="w-full chrome-button-secondary text-samuel-off-white py-2 px-4 text-sm">
                  Database Backup
                </button>
              </div>
            </div>
          </div>

          {/* Admin Test Result */}
          {adminTestResult && (
            <div className="chrome-panel p-6 mb-8">
              <h2 className="text-xl font-semibold text-samuel-off-white mb-4">Admin API Test Result</h2>
              <pre className="bg-black/30 p-4 rounded text-samuel-off-white text-sm overflow-x-auto">
                {JSON.stringify(adminTestResult, null, 2)}
              </pre>
            </div>
          )}

          {/* User Subscription Management */}
          {showUserManagement && (
            <div className="chrome-panel p-6 mb-8">
              <h2 className="text-xl font-semibold text-samuel-off-white mb-6">User Subscription Management</h2>
              
              {users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.playerId} className="border border-samuel-off-white/20 rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-samuel-off-white">
                              {user.displayName || user.email}
                            </h3>
                            {user.subscription ? (
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(user.subscription.status)}`}>
                                {getSubscriptionDisplayName(user.subscription.tier)} - {getStatusDisplayName(user.subscription.status)}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold text-gray-400">No Subscription</span>
                            )}
                          </div>
                          
                          <div className="text-sm text-samuel-off-white/70 space-y-1">
                            <div>Email: {user.email}</div>
                            <div>Joined: {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}</div>
                            <div>Last Login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</div>
                            {user.subscription?.isAdminGranted && (
                              <div className="text-blue-400">✓ Admin Granted Access</div>
                            )}
                            {user.subscription?.notes && (
                              <div className="text-yellow-300">Note: {user.subscription.notes}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {user.subscription ? (
                            <>
                              {user.subscription.tier !== 'AdminGranted' && (
                                <button
                                  onClick={() => handleUserAction(user, 'grant')}
                                  disabled={actionLoading}
                                  className="chrome-button-secondary text-samuel-off-white py-1 px-3 text-xs disabled:opacity-50"
                                >
                                  Grant Free Access
                                </button>
                              )}
                              
                              {user.subscription.isAdminGranted && (
                                <button
                                  onClick={() => handleUserAction(user, 'revoke')}
                                  disabled={actionLoading}
                                  className="chrome-button-secondary text-samuel-off-white py-1 px-3 text-xs border border-yellow-500 hover:bg-yellow-600/20 disabled:opacity-50"
                                >
                                  Revoke Free Access
                                </button>
                              )}
                              
                              {user.subscription.status === 'Active' && (
                                <button
                                  onClick={() => handleUserAction(user, 'suspend')}
                                  disabled={actionLoading}
                                  className="chrome-button-secondary text-samuel-off-white py-1 px-3 text-xs border border-red-500 hover:bg-red-600/20 disabled:opacity-50"
                                >
                                  Suspend
                                </button>
                              )}
                              
                              {user.subscription.status === 'Suspended' && (
                                <button
                                  onClick={() => handleUserAction(user, 'reactivate')}
                                  disabled={actionLoading}
                                  className="chrome-button-secondary text-samuel-off-white py-1 px-3 text-xs border border-green-500 hover:bg-green-600/20 disabled:opacity-50"
                                >
                                  Reactivate
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user, 'grant')}
                              disabled={actionLoading}
                              className="chrome-button text-samuel-off-white py-1 px-3 text-xs disabled:opacity-50"
                            >
                              Grant Free Access
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-samuel-off-white/60 py-8">
                  No users found or failed to load users.
                </div>
              )}
            </div>
          )}

          {/* Recent Activity */}
          <div className="chrome-panel p-6">
            <h2 className="text-xl font-semibold text-samuel-off-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-samuel-off-white/20 pb-2">
                <span className="text-samuel-off-white/80">User sylevus@gmail.com logged in</span>
                <span className="text-samuel-off-white/60 text-sm">Just now</span>
              </div>
              <div className="flex justify-between items-center border-b border-samuel-off-white/20 pb-2">
                <span className="text-samuel-off-white/80">New character created: "Elven Ranger"</span>
                <span className="text-samuel-off-white/60 text-sm">5 minutes ago</span>
              </div>
              <div className="flex justify-between items-center border-b border-samuel-off-white/20 pb-2">
                <span className="text-samuel-off-white/80">Story finalization completed</span>
                <span className="text-samuel-off-white/60 text-sm">10 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;