export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionTier = 'Free' | 'Basic' | 'Professional' | 'Enterprise';

export const SUBSCRIPTION_TIERS = {
  Free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic animal management',
      'Photo contributions to neural network',
      'Reward points system',
      'Basic expense tracking'
    ]
  },
  Basic: {
    name: 'Basic',
    price: 9.99,
    features: [
      'All Free features',
      'AI weight predictions',
      'Advanced analytics',
      'Export capabilities'
    ]
  },
  Professional: {
    name: 'Professional', 
    price: 29.99,
    features: [
      'All Basic features',
      'FFA integration',
      'Advanced AI models',
      'Priority support'
    ]
  },
  Enterprise: {
    name: 'Enterprise',
    price: 99.99,
    features: [
      'All Professional features',
      'Custom integrations',
      'API access',
      'White-label options'
    ]
  }
};

export interface CreateSubscriptionRequest extends Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> {}