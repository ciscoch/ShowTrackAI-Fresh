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
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={styles.summaryValue}>${summary.totalIncome.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>${summary.totalExpenses.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryCard, summary.netProfit >= 0 ? styles.profitCard : styles.lossCard]}>
          <Text style={styles.summaryLabel}>Net {summary.netProfit >= 0 ? 'Profit' : 'Loss'}</Text>
          <Text style={styles.summaryValue}>${Math.abs(summary.netProfit).toFixed(2)}</Text>
          <Text style={styles.profitMargin}>
            {summary.profitMargin.toFixed(1)}% margin
          </Text>
        </View>
      </View>

      {/* Monthly Trend Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>📊 Monthly Trend</Text>
        <View style={styles.trendChart}>
          {summary.monthlyTrend.slice(-6).map((month, index) => (
            <View key={index} style={styles.monthColumn}>
              <Text style={styles.monthLabel}>{month.month.slice(0, 3)}</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.incomeBar, 
                    { height: `${(month.income / Math.max(...summary.monthlyTrend.map(m => m.income))) * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.expenseBar, 
                    { height: `${(month.expenses / Math.max(...summary.monthlyTrend.map(m => m.expenses))) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.monthProfit}>
                {month.profit >= 0 ? '+' : ''}{month.profit.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Expense Categories */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>💸 Top Expenses</Text>
        {summary.topExpenseCategories.map((cat, index) => {
          const category = EXPENSE_CATEGORIES.find(c => c.id === cat.category);
          return (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{category?.icon || '💰'}</Text>
                <Text style={styles.categoryName}>{category?.name || cat.category}</Text>
              </View>
              <View style={styles.categoryAmount}>
                <Text style={styles.amountText}>${cat.amount.toFixed(2)}</Text>
                <Text style={styles.percentageText}>{cat.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })}
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
          <Text style={styles.backButtonText}>← Back</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 60,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 0,
    minWidth: 60,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    flex: 0,
    minWidth: 55,
    maxWidth: 65,
    justifyContent: 'center',
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  lossCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profitMargin: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  monthColumn: {
    flex: 1,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  barContainer: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  incomeBar: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  expenseBar: {
    backgroundColor: '#f44336',
    borderRadius: 4,
  },
  monthProfit: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
  },
  categorySection: {
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
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
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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