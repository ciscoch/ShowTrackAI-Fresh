import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSubscriptionStore } from '../../../core/stores/SubscriptionStore';
import { SubscriptionTier, SUBSCRIPTION_TIERS } from '../../../core/models/Subscription';

interface UpgradeScreenProps {
  onUpgradeComplete: (tier: SubscriptionTier) => void;
  onClose: () => void;
}

export const UpgradeScreen: React.FC<UpgradeScreenProps> = ({
  onUpgradeComplete,
  onClose,
}) => {
  const { subscription, updateSubscription, getCurrentTier } = useSubscriptionStore();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('Basic');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  const currentTier = getCurrentTier();

  useEffect(() => {
    // Set initial selected tier to next level up
    if (currentTier === 'Free') {
      setSelectedTier('Basic');
    } else if (currentTier === 'Basic') {
      setSelectedTier('Professional');
    } else if (currentTier === 'Professional') {
      setSelectedTier('Enterprise');
    }
  }, [currentTier]);

  const calculatePrice = (tier: SubscriptionTier): number => {
    const basePrice = SUBSCRIPTION_TIERS[tier].price;
    return billingPeriod === 'annual' ? basePrice * 10 : basePrice; // 2 months free on annual
  };

  const calculateSavings = (tier: SubscriptionTier): number => {
    const monthlyTotal = SUBSCRIPTION_TIERS[tier].price * 12;
    const annualPrice = calculatePrice(tier);
    return billingPeriod === 'annual' ? monthlyTotal - annualPrice : 0;
  };

  const handleSubscribe = async () => {
    if (selectedTier === currentTier) {
      Alert.alert('Already Subscribed', `You're already on the ${selectedTier} plan.`);
      return;
    }

    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${selectedTier} plan for ${billingPeriod === 'annual' ? 'annual' : 'monthly'} billing?\n\nPrice: $${calculatePrice(selectedTier).toFixed(2)}${billingPeriod === 'annual' ? '/year' : '/month'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setLoading(true);
            try {
              await updateSubscription(selectedTier);
              Alert.alert(
                'Subscription Successful!',
                `Welcome to ${selectedTier}! You now have access to all premium features.`,
                [{ text: 'OK', onPress: () => onUpgradeComplete(selectedTier) }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to process subscription. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderBillingToggle = () => (
    <View style={styles.billingToggle}>
      <TouchableOpacity
        style={[
          styles.billingOption,
          billingPeriod === 'monthly' && styles.billingOptionActive,
        ]}
        onPress={() => setBillingPeriod('monthly')}
      >
        <Text
          style={[
            styles.billingOptionText,
            billingPeriod === 'monthly' && styles.billingOptionTextActive,
          ]}
        >
          Monthly
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.billingOption,
          billingPeriod === 'annual' && styles.billingOptionActive,
        ]}
        onPress={() => setBillingPeriod('annual')}
      >
        <Text
          style={[
            styles.billingOptionText,
            billingPeriod === 'annual' && styles.billingOptionTextActive,
          ]}
        >
          Annual
        </Text>
        <Text style={styles.savingsText}>Save 17%</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanCard = (tier: SubscriptionTier) => {
    const tierInfo = SUBSCRIPTION_TIERS[tier];
    const price = calculatePrice(tier);
    const savings = calculateSavings(tier);
    const isCurrentTier = tier === currentTier;
    const isSelected = tier === selectedTier;
    const isDowngrade = getTierIndex(tier) < getTierIndex(currentTier);

    if (tier === 'Free') return null; // Don't show free tier in upgrade screen

    return (
      <TouchableOpacity
        key={tier}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isCurrentTier && styles.planCardCurrent,
        ]}
        onPress={() => !isCurrentTier && setSelectedTier(tier)}
        disabled={isCurrentTier}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{tierInfo.name}</Text>
          {isCurrentTier && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current Plan</Text>
            </View>
          )}
          {tier === 'Professional' && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Most Popular</Text>
            </View>
          )}
        </View>

        <View style={styles.planPricing}>
          <Text style={styles.planPrice}>
            ${price.toFixed(0)}
            <Text style={styles.planPeriod}>
              /{billingPeriod === 'annual' ? 'year' : 'month'}
            </Text>
          </Text>
          {billingPeriod === 'annual' && savings > 0 && (
            <Text style={styles.planSavings}>
              Save ${savings.toFixed(0)}/year
            </Text>
          )}
        </View>

        <View style={styles.planFeatures}>
          {tierInfo.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentTier && (
          <View style={styles.planAction}>
            {isDowngrade ? (
              <Text style={styles.downgradeText}>
                Contact support to downgrade
              </Text>
            ) : (
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  isSelected && styles.selectButtonSelected,
                ]}
                onPress={() => setSelectedTier(tier)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    isSelected && styles.selectButtonTextSelected,
                  ]}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getTierIndex = (tier: SubscriptionTier): number => {
    const tiers = ['Free', 'Basic', 'Professional', 'Enterprise'];
    return tiers.indexOf(tier);
  };

  const renderFeatureComparison = () => (
    <View style={styles.comparisonSection}>
      <Text style={styles.comparisonTitle}>🔍 Feature Comparison</Text>
      
      <View style={styles.comparisonTable}>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>Animal Management</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
        </View>
        
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>AI Weight Predictions</Text>
          <Text style={styles.comparisonX}>✗</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
        </View>
        
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>Advanced Analytics</Text>
          <Text style={styles.comparisonX}>✗</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
        </View>
        
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>FFA Integration</Text>
          <Text style={styles.comparisonX}>✗</Text>
          <Text style={styles.comparisonX}>✗</Text>
          <Text style={styles.comparisonCheck}>✓</Text>
        </View>
        
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>API Access</Text>
          <Text style={styles.comparisonX}>✗</Text>
          <Text style={styles.comparisonX}>✗</Text>
          <Text style={styles.comparisonX}>✗</Text>
        </View>
      </View>
      
      <View style={styles.comparisonLabels}>
        <Text style={styles.comparisonLabel}>Basic</Text>
        <Text style={styles.comparisonLabel}>Professional</Text>
        <Text style={styles.comparisonLabel}>Enterprise</Text>
      </View>
    </View>
  );

  const renderCurrentPlanInfo = () => {
    if (currentTier === 'Free') return null;

    return (
      <View style={styles.currentPlanInfo}>
        <Text style={styles.currentPlanTitle}>📋 Current Subscription</Text>
        <Text style={styles.currentPlanText}>
          You're currently on the {currentTier} plan
        </Text>
        {subscription && (
          <Text style={styles.currentPlanDetails}>
            Status: {subscription.status} • 
            Auto-renew: {subscription.autoRenew ? 'Enabled' : 'Disabled'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Upgrade Your Plan</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentPlanInfo()}
        
        <View style={styles.billingSection}>
          <Text style={styles.sectionTitle}>Choose Billing Period</Text>
          {renderBillingToggle()}
        </View>

        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Select Your Plan</Text>
          <View style={styles.plansGrid}>
            {(['Basic', 'Professional', 'Enterprise'] as SubscriptionTier[]).map(renderPlanCard)}
          </View>
        </View>

        {renderFeatureComparison()}

        <View style={styles.guaranteeSection}>
          <Text style={styles.guaranteeTitle}>💯 30-Day Money-Back Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Try any paid plan risk-free. If you're not completely satisfied, 
            we'll refund your money within 30 days of purchase.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading || selectedTier === currentTier}
        >
          <Text style={styles.subscribeButtonText}>
            {loading ? 'Processing...' : `Subscribe to ${selectedTier}`}
          </Text>
          <Text style={styles.subscribeButtonPrice}>
            ${calculatePrice(selectedTier).toFixed(2)}/{billingPeriod === 'annual' ? 'year' : 'month'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  currentPlanInfo: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  currentPlanText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  currentPlanDetails: {
    fontSize: 12,
    color: '#666',
  },
  billingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  billingOptionActive: {
    backgroundColor: '#007AFF',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  billingOptionTextActive: {
    color: '#fff',
  },
  savingsText: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#007AFF',
  },
  planCardCurrent: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff8',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  currentBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  popularBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  planPricing: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  planPeriod: {
    fontSize: 16,
    color: '#666',
  },
  planSavings: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: '#28a745',
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  planAction: {
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    minWidth: 120,
  },
  selectButtonSelected: {
    backgroundColor: '#007AFF',
  },
  selectButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectButtonTextSelected: {
    color: '#fff',
  },
  downgradeText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  comparisonSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonTable: {
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  comparisonCheck: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
  },
  comparisonX: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  comparisonLabels: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  comparisonLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginLeft: '16.67%', // Offset for feature column
  },
  guaranteeSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subscribeButtonPrice: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
});