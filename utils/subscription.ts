import api from '@/services/api';

export interface SubscriptionStatus {
  hasSubscription: boolean;
  tier: string;
  status: string;
  isAdminGranted: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
}

export interface Transaction {
  transactionId: number;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

export const SubscriptionTiers = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  ADMIN_GRANTED: 'AdminGranted'
} as const;

export const SubscriptionStatuses = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
  PAST_DUE: 'PastDue',
  TRIALING: 'Trialing'
} as const;

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus | null> => {
  try {
    const response = await api.get('subscription/status');
    return response;
  } catch (error) {
    console.error('Failed to get subscription status:', error);
    return null;
  }
};

export const createSubscription = async (tier: string): Promise<any> => {
  try {
    const response = await api.post('subscription/create', { tier });
    return response;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
};

export const upgradeSubscription = async (newTier: string): Promise<any> => {
  try {
    const response = await api.put('subscription/upgrade', { newTier });
    return response;
  } catch (error) {
    console.error('Failed to upgrade subscription:', error);
    throw error;
  }
};

export const cancelSubscription = async (): Promise<any> => {
  try {
    const response = await api.post('subscription/cancel');
    return response;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
};

export const getTransactionHistory = async (): Promise<Transaction[]> => {
  try {
    const response = await api.get('subscription/transactions');
    return response.transactions || [];
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    return [];
  }
};

export const validateAccess = async (requiredTier: string): Promise<boolean> => {
  try {
    const response = await api.post('subscription/validate-access', { requiredTier });
    return response.hasAccess;
  } catch (error) {
    console.error('Failed to validate access:', error);
    return false;
  }
};

export const getSubscriptionDisplayName = (tier: string): string => {
  switch (tier) {
    case SubscriptionTiers.FREE:
      return 'Free';
    case SubscriptionTiers.PREMIUM:
      return 'Premium';
    case SubscriptionTiers.ADMIN_GRANTED:
      return 'Complimentary';
    default:
      return 'Unknown';
  }
};

export const getStatusDisplayName = (status: string): string => {
  switch (status) {
    case SubscriptionStatuses.ACTIVE:
      return 'Active';
    case SubscriptionStatuses.SUSPENDED:
      return 'Suspended';
    case SubscriptionStatuses.CANCELLED:
      return 'Cancelled';
    case SubscriptionStatuses.PAST_DUE:
      return 'Payment Past Due';
    case SubscriptionStatuses.TRIALING:
      return 'Trial';
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case SubscriptionStatuses.ACTIVE:
      return 'text-green-400';
    case SubscriptionStatuses.SUSPENDED:
      return 'text-red-400';
    case SubscriptionStatuses.CANCELLED:
      return 'text-gray-400';
    case SubscriptionStatuses.PAST_DUE:
      return 'text-yellow-400';
    case SubscriptionStatuses.TRIALING:
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

export const isPremiumTier = (tier: string): boolean => {
  return tier === SubscriptionTiers.PREMIUM || tier === SubscriptionTiers.ADMIN_GRANTED;
};

export const canAccessPremiumFeatures = (subscription: SubscriptionStatus | null): boolean => {
  if (!subscription || !subscription.hasSubscription) return false;
  
  const isActivePremium = isPremiumTier(subscription.tier) && 
    (subscription.status === SubscriptionStatuses.ACTIVE || 
     subscription.status === SubscriptionStatuses.TRIALING);
  
  return isActivePremium;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};