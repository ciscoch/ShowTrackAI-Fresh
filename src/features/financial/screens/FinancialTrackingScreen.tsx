import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFinancialStore } from '../../../core/stores/FinancialStore';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, FinancialEntry } from '../../../core/models/Financial';
import { DatePicker } from '../../../shared/components/DatePicker';
import { FormPicker } from '../../../shared/components/FormPicker';
import { FeedCostCalculator } from '../../../core/services/FeedCostCalculator';
import { KidFriendlyAnalytics } from '../../../core/services/KidFriendlyAnalytics';

interface FinancialTrackingScreenProps {
  onBack: () => void;
}

export const FinancialTrackingScreen: React.FC<FinancialTrackingScreenProps> = ({ onBack }) => {
  const { 
    entries, 
    loadEntries, 
    addEntry, 
    updateEntry,
    deleteEntry,
    getFinancialSummary,
    isLoading 
  } = useFinancialStore();
  
  const { entries: journalEntries } = useJournalStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'feed' | 'aet'>('overview');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  
  // Analytics services
  const feedCalculator = new FeedCostCalculator();
  const kidAnalytics = new KidFriendlyAnalytics();
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    subcategory: '',
    amount: '',
    date: new Date(),
    description: '',
    tags: [] as string[],
    receiptPhoto: null as string | null,
  });

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: '',
      subcategory: '',
      amount: '',
      date: new Date(),
      description: '',
      tags: [],
      receiptPhoto: null,
    });
    setEditingEntry(null);
  };

  const openEditModal = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      category: entry.category,
      subcategory: entry.subcategory || '',
      amount: entry.amount.toString(),
      date: entry.date,
      description: entry.description,
      tags: entry.tags || [],
      receiptPhoto: entry.attachments?.[0] || null,
    });
    setShowAddModal(true);
  };

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const summary = getFinancialSummary();

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please enable photo library access to upload receipts.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, receiptPhoto: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please enable camera access to take receipt photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, receiptPhoto: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Receipt Photo',
      'How would you like to add a receipt photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📷 Take Photo', onPress: takePhoto },
        { text: '📁 Choose from Library', onPress: pickImage },
      ]
    );
  };

  const removeReceiptPhoto = () => {
    setFormData(prev => ({ ...prev, receiptPhoto: null }));
  };

  const handleAddEntry = async () => {
    if (!formData.category || !formData.amount || !formData.description) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (editingEntry) {
      // Update existing entry
      await updateEntry(editingEntry.id, {
        type: formData.type,
        category: formData.category,
        subcategory: formData.subcategory,
        amount,
        date: formData.date,
        description: formData.description,
        tags: formData.tags,
        attachments: formData.receiptPhoto ? [formData.receiptPhoto] : undefined,
      });
    } else {
      // Create new entry
      await addEntry({
        type: formData.type,
        category: formData.category,
        subcategory: formData.subcategory,
        amount,
        date: formData.date,
        description: formData.description,
        tags: formData.tags,
        attachments: formData.receiptPhoto ? [formData.receiptPhoto] : undefined,
        userId: 'current-user',
      });
    }

    // Reset form
    resetForm();
    setShowAddModal(false);
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Hero Summary Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <Text style={styles.heroTitle}>Your Financial Overview</Text>
          <Text style={styles.heroSubtitle}>Track your agricultural business performance</Text>
        </View>
        
        {/* Main KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.incomeKpiCard]}>
            <View style={styles.kpiIconContainer}>
              <Text style={styles.kpiIcon}>💰</Text>
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>Total Income</Text>
              <Text style={styles.kpiValue}>${summary.totalIncome.toFixed(2)}</Text>
              <Text style={styles.kpiTrend}>↗️ +12.3% this month</Text>
            </View>
          </View>
          
          <View style={[styles.kpiCard, styles.expenseKpiCard]}>
            <View style={styles.kpiIconContainer}>
              <Text style={styles.kpiIcon}>📊</Text>
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>Total Expenses</Text>
              <Text style={styles.kpiValue}>${summary.totalExpenses.toFixed(2)}</Text>
              <Text style={styles.kpiTrend}>↘️ -5.7% this month</Text>
            </View>
          </View>
          
          <View style={[styles.kpiCard, styles.netProfitKpiCard, summary.netProfit >= 0 ? styles.profitPositive : styles.profitNegative]}>
            <View style={styles.kpiIconContainer}>
              <Text style={styles.kpiIcon}>{summary.netProfit >= 0 ? '📈' : '📉'}</Text>
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>Net {summary.netProfit >= 0 ? 'Profit' : 'Loss'}</Text>
              <Text style={styles.kpiValue}>${Math.abs(summary.netProfit).toFixed(2)}</Text>
              <Text style={styles.kpiMargin}>
                {summary.profitMargin.toFixed(1)}% margin
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Monthly Trend Chart */}
      <View style={styles.modernChartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.modernSectionTitle}>📊 Monthly Trend</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
              <Text style={styles.legendText}>Expenses</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.modernTrendChart}>
          {summary.monthlyTrend.slice(-6).map((month, index) => (
            <View key={index} style={styles.modernMonthColumn}>
              <View style={styles.modernBarContainer}>
                <View 
                  style={[
                    styles.modernIncomeBar, 
                    { height: `${(month.income / Math.max(...summary.monthlyTrend.map(m => m.income))) * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.modernExpenseBar, 
                    { height: `${(month.expenses / Math.max(...summary.monthlyTrend.map(m => m.expenses))) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.modernMonthLabel}>{month.month.slice(0, 3)}</Text>
              <Text style={[styles.modernMonthProfit, month.profit >= 0 ? styles.positiveProfit : styles.negativeProfit]}>
                {month.profit >= 0 ? '+' : ''}${month.profit.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Enhanced Top Expenses */}
      <View style={styles.modernCategorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.modernSectionTitle}>💸 Top Expenses</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {summary.topExpenseCategories.map((cat, index) => {
          const category = EXPENSE_CATEGORIES.find(c => c.id === cat.category);
          return (
            <View key={index} style={styles.modernCategoryItem}>
              <View style={styles.categoryIconWrapper}>
                <Text style={styles.modernCategoryIcon}>{category?.icon || '💰'}</Text>
              </View>
              <View style={styles.modernCategoryInfo}>
                <Text style={styles.modernCategoryName}>{category?.name || cat.category}</Text>
                <View style={styles.categoryProgressBar}>
                  <View 
                    style={[
                      styles.categoryProgress, 
                      { width: `${cat.percentage}%` }
                    ]} 
                  />
                </View>
              </View>
              <View style={styles.modernCategoryAmount}>
                <Text style={styles.modernAmountText}>${cat.amount.toFixed(2)}</Text>
                <Text style={styles.modernPercentageText}>{cat.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })}
      </View>
      
      {/* Quick Actions Section */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.modernSectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => {
            setFormData(prev => ({ ...prev, type: 'expense' }));
            setShowAddModal(true);
          }}>
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionTitle}>Add Expense</Text>
            <Text style={styles.quickActionSubtitle}>Track spending</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => {
            setFormData(prev => ({ ...prev, type: 'income' }));
            setShowAddModal(true);
          }}>
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionTitle}>Add Income</Text>
            <Text style={styles.quickActionSubtitle}>Record earnings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionTitle}>View Report</Text>
            <Text style={styles.quickActionSubtitle}>Monthly summary</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <Text style={styles.quickActionIcon}>🎯</Text>
            <Text style={styles.quickActionTitle}>Set Budget</Text>
            <Text style={styles.quickActionSubtitle}>Plan expenses</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderEntriesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💸</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>Start tracking your income and expenses</Text>
        </View>
      ) : (
        entries
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .map((entry) => {
            const category = entry.type === 'income' 
              ? INCOME_CATEGORIES.find(c => c.id === entry.category)
              : EXPENSE_CATEGORIES.find(c => c.id === entry.category);
              
            return (
              <View key={entry.id} style={styles.entryItem}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryIcon}>{category?.icon || '💰'}</Text>
                  <View>
                    <Text style={styles.entryDescription}>{entry.description}</Text>
                    <Text style={styles.entryCategory}>{category?.name || entry.category}</Text>
                    <Text style={styles.entryDate}>
                      {entry.date.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryRight}>
                  <Text style={[
                    styles.entryAmount,
                    entry.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                  ]}>
                    {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                  </Text>
                  <View style={styles.entryActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => openEditModal(entry)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Entry',
                          'Are you sure you want to delete this entry?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Delete', 
                              style: 'destructive',
                              onPress: () => deleteEntry(entry.id)
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
      )}
    </ScrollView>
  );

  const renderFeedAnalyticsTab = () => {
    const feedAnalytics = summary.feedAnalytics;
    const recentFeedEntries = journalEntries.filter(e => e.feedData && e.feedData.feeds.length > 0);
    
    // Sample data for demonstration - in real app this would come from actual feed tracking
    const sampleMetrics = {
      feedConversionRatio: 7.2,
      costPerLbGain: 3.45,
      dailyWeightGain: 2.1,
      profitPerLb: 0.75,
      dailyFeedCost: 4.75,
      costPerPoundFeed: 0.56,
      efficiencyGrade: "B+ (Good)",
      recommendations: [
        "Switch to Premium Cattle Feed - could save $0.12/lb",
        "Buy feed in bulk (100+ lbs) - save 8% on cost",
        "Feed Store Plus has your feed $0.04/lb cheaper"
      ]
    };

    const efficiency = feedCalculator.efficiencyEmojiScale(sampleMetrics.feedConversionRatio);
    const profitStatus = feedCalculator.profitSimpleIndicator(sampleMetrics.profitPerLb);
    const reportCard = feedCalculator.calculateReportCard(sampleMetrics);
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Kid-Friendly Feed Performance Dashboard */}
        <View style={styles.kidDashboardCard}>
          <Text style={styles.kidDashboardTitle}>📊 Your Feed Performance This Month</Text>
          
          {/* Key Numbers - Easy to Understand */}
          <View style={styles.keyNumbersSection}>
            <Text style={styles.keyNumbersTitle}>🎯 KEY NUMBERS (Easy to Understand!)</Text>
            
            <View style={styles.keyMetricsContainer}>
              <View style={styles.keyMetric}>
                <Text style={styles.keyMetricIcon}>💰</Text>
                <Text style={styles.keyMetricLabel}>Feed Cost per Day</Text>
                <Text style={styles.keyMetricValue}>${sampleMetrics.dailyFeedCost}</Text>
              </View>
              
              <View style={styles.keyMetric}>
                <Text style={styles.keyMetricIcon}>⚖️</Text>
                <Text style={styles.keyMetricLabel}>Weight Gain This Month</Text>
                <Text style={styles.keyMetricValue}>+{Math.round(sampleMetrics.dailyWeightGain * 30)} lbs</Text>
              </View>
              
              <View style={styles.keyMetric}>
                <Text style={styles.keyMetricIcon}>🏆</Text>
                <Text style={styles.keyMetricLabel}>Cost per Pound Gained</Text>
                <Text style={styles.keyMetricValue}>${sampleMetrics.costPerLbGain}</Text>
              </View>
            </View>
          </View>

          {/* Profitability Status */}
          <View style={styles.profitabilitySection}>
            <Text style={styles.profitabilityTitle}>📈 IS YOUR FEEDING PROFITABLE?</Text>
            <View style={[styles.profitabilityCard, { backgroundColor: profitStatus.color === 'green' ? '#d4edda' : '#cce7ff' }]}>
              <Text style={styles.profitabilityStatus}>
                {profitStatus.status === 'profitable' ? '✅ YES! You\'re doing great!' : '📚 Learning experience!'}
              </Text>
              <Text style={styles.profitabilityMessage}>{profitStatus.message}</Text>
              {profitStatus.status === 'profitable' && (
                <Text style={styles.profitabilityEncouragement}>
                  🎉 Keep it up! Your animal is gaining efficiently!
                </Text>
              )}
            </View>
          </View>

          {/* Smart Suggestions */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>🤔 SMART SUGGESTIONS:</Text>
            {sampleMetrics.recommendations.map((suggestion, index) => (
              <Text key={index} style={styles.suggestionItem}>• {suggestion}</Text>
            ))}
          </View>

          {/* Report Card */}
          <View style={styles.reportCardSection}>
            <Text style={styles.reportCardTitle}>📊 THIS MONTH'S REPORT CARD:</Text>
            <View style={styles.reportCardItems}>
              <Text style={styles.reportCardItem}>Feed Efficiency: {reportCard.feedEfficiency}</Text>
              <Text style={styles.reportCardItem}>Cost Management: {reportCard.costManagement}</Text>
              <Text style={styles.reportCardItem}>Weight Gain: {reportCard.weightGain}</Text>
            </View>
          </View>

          {/* Efficiency Scale */}
          <View style={styles.efficiencySection}>
            <Text style={styles.efficiencyTitle}>🔥 Your Efficiency Level:</Text>
            <Text style={styles.efficiencyScale}>{efficiency}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  type: 'expense', 
                  category: 'feed_supplies',
                  description: 'Feed purchase'
                }));
                setShowAddModal(true);
              }}
            >
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Quick Feed Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>🛒</Text>
              <Text style={styles.quickActionText}>Find Better Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📈</Text>
              <Text style={styles.quickActionText}>View Trends</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed Cost by Brand */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>📊 Cost by Feed Brand</Text>
          {Object.entries(feedAnalytics.feedCostByBrand).length > 0 ? (
            Object.entries(feedAnalytics.feedCostByBrand).map(([brand, cost]) => (
              <View key={brand} style={styles.brandItem}>
                <Text style={styles.brandName}>{brand}</Text>
                <Text style={styles.brandCost}>${cost.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataIcon}>🌾</Text>
              <Text style={styles.noDataText}>Start tracking feed purchases to see brand analytics!</Text>
              <TouchableOpacity 
                style={styles.startTrackingButton}
                onPress={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    type: 'expense', 
                    category: 'feed_supplies',
                    description: 'Feed purchase'
                  }));
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.startTrackingText}>📝 Add First Feed Purchase</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Journal Feed Data Integration */}
        <View style={styles.integrationSection}>
          <Text style={styles.sectionTitle}>📝 Recent Feed Tracking</Text>
          {recentFeedEntries.length > 0 ? (
            recentFeedEntries.slice(0, 5).map((entry, index) => (
              <View key={index} style={styles.feedJournalItem}>
                <View style={styles.feedJournalContent}>
                  <Text style={styles.feedJournalTitle}>{entry.title}</Text>
                  <Text style={styles.feedJournalDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.feedJournalDetails}>
                    {entry.feedData.feeds.length} feeds • ${entry.feedData.totalCost?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={() => {
                    Alert.alert(
                      'Link to Financial Entry',
                      'Create a financial expense entry for this feed?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Create Entry',
                          onPress: async () => {
                            await addEntry({
                              type: 'expense',
                              category: 'feed_supplies',
                              amount: entry.feedData.totalCost || 0,
                              date: new Date(entry.date),
                              description: `Feed for ${entry.title}`,
                              tags: entry.feedData.feeds.map(f => `brand:${f.brand}`),
                              feedId: entry.id,
                              userId: 'current-user'
                            });
                            Alert.alert('Success', 'Financial entry created');
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.linkButtonText}>Link 🔗</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataIcon}>📋</Text>
              <Text style={styles.noDataText}>No feed tracking entries yet. Start by adding feed data in your journal entries!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderAETTab = () => {
    const aetSkills = summary.aetFinancialSkills;
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.aetSection}>
          <Text style={styles.aetTitle}>🎓 AET Financial Skills Assessment</Text>
          
          {/* Skills Progress */}
          <View style={styles.skillsContainer}>
            <View style={styles.skillItem}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>📊 Record Keeping</Text>
                <Text style={styles.skillScore}>{aetSkills.recordKeeping}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${aetSkills.recordKeeping}%` }]} />
              </View>
              <Text style={styles.skillDescription}>
                Track all income and expenses accurately
              </Text>
            </View>

            <View style={styles.skillItem}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>💰 Budgeting</Text>
                <Text style={styles.skillScore}>{aetSkills.budgeting}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${aetSkills.budgeting}%` }]} />
              </View>
              <Text style={styles.skillDescription}>
                Create and maintain budgets for your SAE
              </Text>
            </View>

            <View style={styles.skillItem}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>📈 Profit Analysis</Text>
                <Text style={styles.skillScore}>{aetSkills.profitAnalysis}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${aetSkills.profitAnalysis}%` }]} />
              </View>
              <Text style={styles.skillDescription}>
                Analyze profitability and ROI
              </Text>
            </View>

            <View style={styles.skillItem}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>🎯 Marketing Skills</Text>
                <Text style={styles.skillScore}>{aetSkills.marketingSkills}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${aetSkills.marketingSkills}%` }]} />
              </View>
              <Text style={styles.skillDescription}>
                Document marketing strategies and outcomes
              </Text>
            </View>
          </View>

          {/* AET Standards Alignment */}
          <View style={styles.standardsSection}>
            <Text style={styles.standardsTitle}>📚 AET Standards Alignment</Text>
            <View style={styles.standardsList}>
              <View style={styles.standardItem}>
                <Text style={styles.standardCode}>ABM.01.01</Text>
                <Text style={styles.standardDesc}>Apply economic principles to SAE</Text>
              </View>
              <View style={styles.standardItem}>
                <Text style={styles.standardCode}>ABM.01.02</Text>
                <Text style={styles.standardDesc}>Manage financial resources</Text>
              </View>
              <View style={styles.standardItem}>
                <Text style={styles.standardCode}>ABM.02.01</Text>
                <Text style={styles.standardDesc}>Develop marketing strategies</Text>
              </View>
              <View style={styles.standardItem}>
                <Text style={styles.standardCode}>ABM.03.01</Text>
                <Text style={styles.standardDesc}>Maintain financial records</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingEntry ? 'Edit Entry' : 'Add Entry'}</Text>
            <TouchableOpacity onPress={() => {
              resetForm();
              setShowAddModal(false);
            }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Entry Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
              >
                <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
              >
                <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Picker */}
            <FormPicker
              label="Category"
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              options={
                formData.type === 'income'
                  ? INCOME_CATEGORIES.map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))
                  : EXPENSE_CATEGORIES.map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))
              }
              placeholder="Select category"
              required
            />

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Date Picker */}
            <DatePicker
              label="Date"
              value={formData.date}
              onDateChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
              required
            />

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter details about this transaction..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Receipt Photo Upload - Only for Expenses */}
            {formData.type === 'expense' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Receipt Photo</Text>
              {formData.receiptPhoto ? (
                <View style={styles.receiptPhotoContainer}>
                  <Image 
                    source={{ uri: formData.receiptPhoto }} 
                    style={styles.receiptPhotoPreview} 
                  />
                  <View style={styles.receiptPhotoActions}>
                    <TouchableOpacity 
                      style={styles.changePhotoButton}
                      onPress={showImagePickerOptions}
                    >
                      <Text style={styles.changePhotoButtonText}>Change Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={removeReceiptPhoto}
                    >
                      <Text style={styles.removePhotoButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={showImagePickerOptions}
                >
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={styles.addPhotoText}>Add Receipt Photo</Text>
                  <Text style={styles.addPhotoSubtext}>Tap to take a photo or choose from library</Text>
                </TouchableOpacity>
              )}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                resetForm();
                setShowAddModal(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleAddEntry}
            >
              <Text style={styles.saveButtonText}>{editingEntry ? 'Update Entry' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 Financial Tracking</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'entries' && styles.activeTab]}
          onPress={() => setActiveTab('entries')}
        >
          <Text style={[styles.tabText, activeTab === 'entries' && styles.activeTabText]}>
            Entries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed Analytics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'aet' && styles.activeTab]}
          onPress={() => setActiveTab('aet')}
        >
          <Text style={[styles.tabText, activeTab === 'aet' && styles.activeTabText]}>
            AET Skills
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'entries' && renderEntriesTab()}
        {activeTab === 'feed' && renderFeedAnalyticsTab()}
        {activeTab === 'aet' && renderAETTab()}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {renderAddModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 70,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Modern Hero Section
  heroSection: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    marginBottom: 24,
  },
  heroBackground: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    fontWeight: '400',
  },
  
  // Modern KPI Cards
  kpiGrid: {
    paddingHorizontal: 20,
    marginTop: -40,
    gap: 16,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  kpiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kpiIcon: {
    fontSize: 24,
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  kpiTrend: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  kpiMargin: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  incomeKpiCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expenseKpiCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  netProfitKpiCard: {
    borderLeftWidth: 4,
  },
  profitPositive: {
    borderLeftColor: '#10B981',
  },
  profitNegative: {
    borderLeftColor: '#EF4444',
  },
  // Modern Chart Section
  modernChartSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernTrendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    alignItems: 'flex-end',
  },
  modernMonthColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  modernBarContainer: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: 3,
  },
  modernIncomeBar: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    width: 12,
    minHeight: 8,
  },
  modernExpenseBar: {
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    width: 12,
    minHeight: 8,
  },
  modernMonthLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernMonthProfit: {
    fontSize: 11,
    fontWeight: '600',
  },
  positiveProfit: {
    color: '#10B981',
  },
  negativeProfit: {
    color: '#EF4444',
  },
  // Modern Category Section
  modernCategorySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewAllText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  modernCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernCategoryIcon: {
    fontSize: 20,
  },
  modernCategoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  modernCategoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryProgressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  modernCategoryAmount: {
    alignItems: 'flex-end',
  },
  modernAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  modernPercentageText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Quick Actions Section
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  entryItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  entryIcon: {
    fontSize: 24,
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  entryCategory: {
    fontSize: 12,
    color: '#666',
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#f44336',
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  feedSummaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  feedMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feedMetric: {
    alignItems: 'center',
  },
  feedMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  feedMetricLabel: {
    fontSize: 12,
    color: '#666',
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brandName: {
    fontSize: 14,
    color: '#333',
  },
  brandCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  integrationSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedJournalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedJournalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  feedJournalDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  feedJournalDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  linkButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  aetSection: {
    padding: 16,
  },
  aetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  skillsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillItem: {
    marginBottom: 20,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  skillScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  skillDescription: {
    fontSize: 12,
    color: '#666',
  },
  standardsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  standardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  standardsList: {
    gap: 12,
  },
  standardItem: {
    flexDirection: 'row',
    gap: 12,
  },
  standardCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    width: 80,
  },
  standardDesc: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#fff',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  // Kid-Friendly Feed Analytics Styles
  kidDashboardCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  kidDashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  keyNumbersSection: {
    marginBottom: 20,
  },
  keyNumbersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  keyMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  keyMetric: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    padding: 12,
    borderRadius: 12,
    minWidth: '30%',
    marginBottom: 8,
  },
  keyMetricIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  keyMetricLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  keyMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  profitabilitySection: {
    marginBottom: 20,
  },
  profitabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  profitabilityCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  profitabilityStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  profitabilityMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  profitabilityEncouragement: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  reportCardSection: {
    marginBottom: 20,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reportCardItems: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  reportCardItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  efficiencySection: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  efficiencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  efficiencyScale: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  startTrackingButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  startTrackingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  feedJournalContent: {
    flex: 1,
  },
  // Receipt Photo Upload Styles
  receiptPhotoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  receiptPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  receiptPhotoActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  changePhotoButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  changePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  removePhotoButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  removePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  addPhotoButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  addPhotoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addPhotoSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});