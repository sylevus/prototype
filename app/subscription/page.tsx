'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenValid } from '@/utils/auth';
import { 
  getSubscriptionStatus, 
  createSubscription, 
  upgradeSubscription, 
  cancelSubscription,
  getTransactionHistory,
  getSubscriptionDisplayName,
  getStatusDisplayName,
  getStatusColor,
  isPremiumTier,
  canAccessPremiumFeatures,
  formatCurrency,
  formatDate,
  SubscriptionTiers,
  SubscriptionStatuses,
  type SubscriptionStatus,
  type Transaction
} from '@/utils/subscription';

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !isTokenValid(token)) {
      router.push('/');
      return;
    }

    loadSubscriptionData();
  }, [router]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const subscriptionData = await getSubscriptionStatus();
      setSubscription(subscriptionData);

      if (subscriptionData?.hasSubscription) {
        const transactionData = await getTransactionHistory();
        setTransactions(transactionData);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (tier: string) => {
    try {
      setActionLoading(true);
      await createSubscription(tier);
      await loadSubscriptionData();
    } catch (error: any) {
      alert(`Failed to create subscription: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeSubscription = async () => {
    try {
      setActionLoading(true);
      await upgradeSubscription(SubscriptionTiers.PREMIUM);
      await loadSubscriptionData();
    } catch (error: any) {
      alert(`Failed to upgrade subscription: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelSubscription();
      await loadSubscriptionData();
    } catch (error: any) {
      alert(`Failed to cancel subscription: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen chrome-gradient flex items-center justify-center">
        <div className="text-samuel-off-white text-xl">Loading...</div>
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
              Subscription Management
            </h1>
            <p className="text-samuel-off-white/80">
              Manage your subscription and billing preferences
            </p>
          </div>

          {subscription?.hasSubscription ? (
            // Existing subscription view
            <div className="space-y-8">
              {/* Current Subscription Card */}
              <div className="chrome-panel p-8">
                <h2 className="text-2xl font-semibold text-samuel-off-white mb-6">Current Subscription</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-samuel-off-white/80">Plan:</span>
                        <span className="text-samuel-off-white font-semibold text-lg">
                          {getSubscriptionDisplayName(subscription.tier)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-samuel-off-white/80">Status:</span>
                        <span className={`font-semibold ${getStatusColor(subscription.status)}`}>
                          {getStatusDisplayName(subscription.status)}
                        </span>
                      </div>

                      {subscription.isAdminGranted && (
                        <div className="flex items-center justify-between">
                          <span className="text-samuel-off-white/80">Type:</span>
                          <span className="text-blue-400 font-semibold">
                            Admin Granted
                          </span>
                        </div>
                      )}

                      {subscription.currentPeriodEnd && (
                        <div className="flex items-center justify-between">
                          <span className="text-samuel-off-white/80">
                            {subscription.status === SubscriptionStatuses.CANCELLED ? 'Access until:' : 'Next billing:'}
                          </span>
                          <span className="text-samuel-off-white font-semibold">
                            {formatDate(subscription.currentPeriodEnd)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {subscription.tier === SubscriptionTiers.FREE && (
                      <button
                        onClick={handleUpgradeSubscription}
                        disabled={actionLoading}
                        className="w-full chrome-button text-samuel-off-white py-3 px-6 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Upgrade to Premium'}
                      </button>
                    )}

                    {isPremiumTier(subscription.tier) && 
                     subscription.status === SubscriptionStatuses.ACTIVE && 
                     !subscription.isAdminGranted && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={actionLoading}
                        className="w-full chrome-button-secondary text-samuel-off-white py-3 px-6 border border-red-500 hover:bg-red-600/20 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Cancel Subscription'}
                      </button>
                    )}

                    {subscription.status === SubscriptionStatuses.SUSPENDED && (
                      <div className="p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
                        <p className="text-yellow-200 text-sm">
                          Your account is suspended. Please contact support or update your payment method.
                        </p>
                      </div>
                    )}

                    {subscription.status === SubscriptionStatuses.PAST_DUE && (
                      <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
                        <p className="text-red-200 text-sm">
                          Your payment is overdue. Please update your payment method to restore access.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Features Card */}
              <div className="chrome-panel p-8">
                <h2 className="text-2xl font-semibold text-samuel-off-white mb-6">Your Plan Features</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-samuel-off-white mb-4">Included</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-samuel-off-white/80">
                        <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Character creation and storage
                      </li>
                      {canAccessPremiumFeatures(subscription) && (
                        <>
                          <li className="flex items-center text-samuel-off-white/80">
                            <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Unlimited AI interactions
                          </li>
                          <li className="flex items-center text-samuel-off-white/80">
                            <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Advanced storytelling features
                          </li>
                          <li className="flex items-center text-samuel-off-white/80">
                            <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Character image generation
                          </li>
                          <li className="flex items-center text-samuel-off-white/80">
                            <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Priority support
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {!canAccessPremiumFeatures(subscription) && (
                    <div>
                      <h3 className="text-lg font-semibold text-samuel-off-white mb-4">Upgrade for More</h3>
                      <ul className="space-y-3">
                        <li className="flex items-center text-samuel-off-white/50">
                          <svg className="w-5 h-5 text-gray-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Unlimited AI interactions
                        </li>
                        <li className="flex items-center text-samuel-off-white/50">
                          <svg className="w-5 h-5 text-gray-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Advanced storytelling features
                        </li>
                        <li className="flex items-center text-samuel-off-white/50">
                          <svg className="w-5 h-5 text-gray-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Character image generation
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction History */}
              {transactions.length > 0 && (
                <div className="chrome-panel p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-samuel-off-white">Billing History</h2>
                    <button
                      onClick={() => setShowTransactions(!showTransactions)}
                      className="chrome-button-secondary text-samuel-off-white py-2 px-4 text-sm"
                    >
                      {showTransactions ? 'Hide' : 'Show'} History
                    </button>
                  </div>

                  {showTransactions && (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.transactionId} className="border border-samuel-off-white/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-samuel-off-white font-semibold">
                              {transaction.description || transaction.type}
                            </span>
                            <span className={`font-semibold ${
                              transaction.status === 'Succeeded' ? 'text-green-400' : 
                              transaction.status === 'Failed' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-samuel-off-white/60">
                            <span>{formatDate(transaction.createdAt)}</span>
                            <span className={`${
                              transaction.status === 'Succeeded' ? 'text-green-400' : 
                              transaction.status === 'Failed' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                          {transaction.failureReason && (
                            <div className="mt-2 text-sm text-red-400">
                              {transaction.failureReason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // No subscription - show plans
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-samuel-off-white mb-4">
                  Choose Your Plan
                </h2>
                <p className="text-samuel-off-white/70 text-lg">
                  Start with our free tier or unlock premium features for the ultimate RPG experience.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="chrome-panel p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-samuel-off-white mb-2">Free</h3>
                    <div className="text-3xl font-bold text-samuel-bright-red mb-6">
                      $0<span className="text-lg text-samuel-off-white/60">/month</span>
                    </div>
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
                    <button
                      onClick={() => handleCreateSubscription(SubscriptionTiers.FREE)}
                      disabled={actionLoading}
                      className="w-full chrome-button-secondary text-samuel-off-white py-3 px-6 disabled:opacity-50"
                    >
                      {actionLoading ? 'Creating...' : 'Start Free'}
                    </button>
                  </div>
                </div>

                {/* Premium Plan */}
                <div className="chrome-panel p-8 border-2 border-samuel-bright-red relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-samuel-bright-red text-samuel-off-white px-4 py-1 text-sm font-semibold rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-samuel-off-white mb-2">Premium</h3>
                    <div className="text-3xl font-bold text-samuel-bright-red mb-6">
                      $9.99<span className="text-lg text-samuel-off-white/60">/month</span>
                    </div>
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
                    <button
                      onClick={() => handleCreateSubscription(SubscriptionTiers.PREMIUM)}
                      disabled={actionLoading}
                      className="w-full chrome-button text-samuel-off-white py-3 px-6 disabled:opacity-50"
                    >
                      {actionLoading ? 'Creating...' : 'Start Premium'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;