import { create } from 'zustand';
import { Subscription, SubscriptionTier, SUBSCRIPTION_TIERS } from '../models/Subscription';
import { storageService, STORAGE_KEYS } from '../services/StorageService';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionActions {
  updateSubscription: (tier: SubscriptionTier) => Promise<void>;
  getIsProMember: () => boolean;
  getCurrentTier: () => SubscriptionTier;
  getFeatures: () => string[];
  loadSubscription: () => Promise<void>;
  saveSubscription: () => Promise<void>;
}

type SubscriptionStore = SubscriptionState & SubscriptionActions;

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  isLoading: false,
  error: null,

  updateSubscription: async (tier: SubscriptionTier) => {
    const newSubscription: Subscription = {
      id: Date.now().toString(),
      userId: 'current_user',
      tier,
      status: 'active',
      startDate: new Date(),
      autoRenew: true,
      features: SUBSCRIPTION_TIERS[tier].features,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set({ subscription: newSubscription, error: null });
    
    try {
      await get().saveSubscription();
    } catch (error) {
      set({ error: 'Failed to update subscription' });
    }
  },

  getIsProMember: () => {
    const subscription = get().subscription;
    return subscription?.tier === 'Professional' || subscription?.tier === 'Enterprise';
  },

  getCurrentTier: () => {
    return get().subscription?.tier || 'Free';
  },

  getFeatures: () => {
    const tier = get().getCurrentTier();
    return SUBSCRIPTION_TIERS[tier].features;
  },

  loadSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedSubscription = await storageService.loadData<Subscription>(STORAGE_KEYS.SUBSCRIPTION);
      
      if (savedSubscription) {
        const subscriptionWithDates = {
          ...savedSubscription,
          startDate: new Date(savedSubscription.startDate),
          endDate: savedSubscription.endDate ? new Date(savedSubscription.endDate) : undefined,
          lastPaymentDate: savedSubscription.lastPaymentDate ? new Date(savedSubscription.lastPaymentDate) : undefined,
          nextPaymentDate: savedSubscription.nextPaymentDate ? new Date(savedSubscription.nextPaymentDate) : undefined,
          createdAt: new Date(savedSubscription.createdAt),
          updatedAt: new Date(savedSubscription.updatedAt),
        };
        
        set({ subscription: subscriptionWithDates, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to load subscription', isLoading: false });
    }
  },

  saveSubscription: async () => {
    try {
      const { subscription } = get();
      if (subscription) {
        await storageService.saveData(STORAGE_KEYS.SUBSCRIPTION, subscription);
      }
    } catch (error) {
      set({ error: 'Failed to save subscription' });
    }
  },
}));