import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useAuth } from '../../../core/contexts/AuthContext';
import { useFinancialStore } from '../../../core/stores/FinancialStore';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { useAnimalStore } from '../../../core/stores/AnimalStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, FinancialEntry } from '../../../core/models/Financial';
import { 
  ExpenseLineItem, 
  ProcessReceiptResponse, 
  EXPENSE_CATEGORIES as EXPENSE_CATS
} from '../../../core/models/Expense';
import { DatePicker } from '../../../shared/components/DatePicker';
import { FormPicker } from '../../../shared/components/FormPicker';
import { FeedCostCalculator } from '../../../core/services/FeedCostCalculator';
import { KidFriendlyAnalytics } from '../../../core/services/KidFriendlyAnalytics';
import { AIReceiptProcessor } from '../../../core/services/AIReceiptProcessor';

interface FinancialTrackingScreenProps {
  onBack: () => void;
}

export const FinancialTrackingScreen: React.FC<FinancialTrackingScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
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
  const { animals, loadAnimals } = useAnimalStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'feed' | 'aet'>('overview');
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  
  // AI Receipt Processing State
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptProcessingResult, setReceiptProcessingResult] = useState<ProcessReceiptResponse | null>(null);
  const [showReceiptReview, setShowReceiptReview] = useState(false);
  
  // Entry View State
  const [viewingEntry, setViewingEntry] = useState<FinancialEntry | null>(null);
  const [showEntryView, setShowEntryView] = useState(false);
  
  // Force update counter for animal changes
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  
  // Manual Input Modals State
  const [showManualCategoryModal, setShowManualCategoryModal] = useState(false);
  const [showFeedWeightModal, setShowFeedWeightModal] = useState(false);
  const [showBulkFixModal, setShowBulkFixModal] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState<any>(null);
  const [manualCategory, setManualCategory] = useState('');
  const [manualFeedWeight, setManualFeedWeight] = useState('');
  const [bulkFixItems, setBulkFixItems] = useState<any[]>([]);
  
  // Debug state changes
  useEffect(() => {
    console.log('🎭 showReceiptReview state changed:', showReceiptReview);
  }, [showReceiptReview]);
  
  useEffect(() => {
    console.log('🎭 Modal states - AddModal:', showAddModal, 'ReceiptReview:', showReceiptReview, 'EntryView:', showEntryView);
  }, [showAddModal, showReceiptReview, showEntryView]);
  
  // Analytics services
  const feedCalculator = new FeedCostCalculator();
  const kidAnalytics = new KidFriendlyAnalytics();
  const aiReceiptProcessor = new AIReceiptProcessor();
  
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
    vendor: '',
    vendorLocation: '',
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
      vendor: '',
      vendorLocation: '',
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
      vendor: entry.vendor || '',
      vendorLocation: entry.vendorLocation || '',
    });
    setShowAddModal(true);
  };

  useEffect(() => {
    loadEntries();
    loadAnimals();
  }, [loadEntries, loadAnimals]);

  // Refresh data when tab becomes active
  useEffect(() => {
    if (activeTab === 'overview') {
      loadAnimals();
    }
  }, [activeTab, loadAnimals]);

  // Subscribe to animal store changes to force financial summary updates
  useEffect(() => {
    const unsubscribe = useAnimalStore.subscribe(
      (state) => state.animals,
      (animals) => {
        console.log('🐄 Animal store changed, forcing financial summary update');
        setForceUpdateCounter(prev => prev + 1);
      }
    );
    
    return unsubscribe;
  }, []);

  // Recalculate summary when animals or entries change
  const summary = useMemo(() => {
    console.log('🔄 Recalculating financial summary with animals:', animals.length);
    console.log('🔄 Force update counter:', forceUpdateCounter);
    
    // Debug: Log animals with predicted sale costs
    const animalsWithPredictions = animals.filter(animal => 
      animal.predictedSaleCost && animal.predictedSaleCost > 0
    );
    console.log('📊 Animals with predicted sale costs:', animalsWithPredictions.length);
    animalsWithPredictions.forEach(animal => {
      console.log(`  - ${animal.name}: $${animal.predictedSaleCost}`);
    });
    
    return getFinancialSummary(undefined, undefined, animals);
  }, [animals, entries, forceUpdateCounter]);

  const pickImage = async () => {
    try {
      console.log('📸 Starting image picker process...');
      
      // Request permissions
      console.log('🔐 Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔐 Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ Permission denied');
        Alert.alert('Permission Required', 'Please enable photo library access to upload receipts.');
        return;
      }

      console.log('✅ Permission granted, launching image picker...');
      
      // Launch image picker with enhanced error handling
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No editing to show full receipt
        quality: 0.9, // Higher quality for better text recognition
        base64: false,
        exif: false,
        presentationStyle: 'fullScreen', // Full screen for better viewing
      });

      console.log('📱 Image picker result:', result);

      if (result.canceled) {
        console.log('❌ User canceled image selection');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('❌ No assets returned from image picker');
        Alert.alert('Error', 'No image was selected. Please try again.');
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        console.log('❌ No URI in selected asset');
        Alert.alert('Error', 'Invalid image selected. Please try again.');
        return;
      }

      const imageUri = asset.uri;
      console.log('📸 Photo selected successfully!');
      console.log('📷 Image URI:', imageUri);
      console.log('📏 Image dimensions:', asset.width, 'x', asset.height);
      
      setFormData(prev => {
        const newData = { ...prev, receiptPhoto: imageUri };
        console.log('📋 Form data updated with photo:', newData.receiptPhoto ? 'HAS PHOTO' : 'NO PHOTO');
        return newData;
      });
      
      // Immediate alert for better visibility
      console.log('🚨 About to show AI processing alert');
      setTimeout(() => {
        Alert.alert(
          '🤖 AI Receipt Processing Available!',
          'I can automatically extract items and categories from this receipt!\n\n✨ AI Features:\n• Auto-categorize expenses\n• Extract feed weights for analysis\n• Create multiple expense entries\n• Smart vendor detection\n\nWould you like me to process this receipt now?',
          [
            { 
              text: 'Skip AI Processing', 
              style: 'cancel',
              onPress: () => console.log('❌ User skipped AI processing')
            },
            { 
              text: '🚀 Yes, Process Now!', 
              onPress: () => {
                console.log('🤖 User selected AI processing');
                processReceiptWithAI(imageUri);
              }
            }
          ],
          { cancelable: false }
        );
      }, 100);
    } catch (error) {
      console.error('❌ Error in pickImage:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      Alert.alert(
        'Image Selection Error',
        `Failed to select image: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the problem persists.`
      );
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📷 Starting camera process...');
      
      // Request permissions
      console.log('🔐 Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔐 Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ Camera permission denied');
        Alert.alert('Permission Required', 'Please enable camera access to take receipt photos.');
        return;
      }

      console.log('✅ Camera permission granted, launching camera...');
      
      // Launch camera with enhanced error handling
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // No editing to show full receipt
        quality: 0.9, // Higher quality for better text recognition
        base64: false,
        exif: false,
        presentationStyle: 'fullScreen', // Full screen for better viewing
      });

      console.log('📷 Camera result:', result);

      if (result.canceled) {
        console.log('❌ User canceled camera');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('❌ No assets returned from camera');
        Alert.alert('Error', 'No photo was captured. Please try again.');
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        console.log('❌ No URI in captured photo');
        Alert.alert('Error', 'Invalid photo captured. Please try again.');
        return;
      }

      const imageUri = asset.uri;
      console.log('📷 Photo captured successfully!');
      console.log('📷 Image URI:', imageUri);
      console.log('📏 Image dimensions:', asset.width, 'x', asset.height);
      
      setFormData(prev => {
        const newData = { ...prev, receiptPhoto: imageUri };
        console.log('📋 Form data updated with photo:', newData.receiptPhoto ? 'HAS PHOTO' : 'NO PHOTO');
        return newData;
      });
      
      // Immediate alert for better visibility
      console.log('🚨 About to show AI processing alert (camera)');
      setTimeout(() => {
        Alert.alert(
          '📷 Receipt Photo Captured!',
          'Great photo! I can automatically extract items and categories from this receipt!\n\n✨ AI Features:\n• Auto-categorize expenses\n• Extract feed weights for analysis\n• Create multiple expense entries\n• Smart vendor detection\n\nWould you like me to process this receipt now?',
          [
            { 
              text: 'Skip AI Processing', 
              style: 'cancel',
              onPress: () => console.log('❌ User skipped AI processing (camera)')
            },
            { 
              text: '🚀 Yes, Process Now!', 
              onPress: () => {
                console.log('🤖 User selected AI processing from camera');
                processReceiptWithAI(imageUri);
              }
            }
          ],
          { cancelable: false }
        );
      }, 100);
    } catch (error) {
      console.error('❌ Error in takePhoto:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      Alert.alert(
        'Camera Error',
        `Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the problem persists.`
      );
    }
  };

  const showImagePickerOptions = () => {
    console.log('📸 Opening image picker options');
    Alert.alert(
      '📷 Receipt Photo',
      'How would you like to add a receipt photo?\n\n🤖 AI will automatically process your receipt after upload!',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('❌ User canceled image picker options')
        },
        { 
          text: '📷 Take Photo', 
          onPress: () => {
            console.log('📷 User selected Take Photo');
            takePhoto();
          }
        },
        { 
          text: '📁 Choose from Library', 
          onPress: () => {
            console.log('📁 User selected Choose from Library');
            pickImage();
          }
        },
      ]
    );
  };

  const removeReceiptPhoto = () => {
    setFormData(prev => ({ ...prev, receiptPhoto: null }));
    setReceiptProcessingResult(null);
  };

  // Manual Input Modal Functions
  const openManualCategoryModal = (item: any) => {
    setEditingLineItem(item);
    setManualCategory(item.category || '');
    setShowManualCategoryModal(true);
  };

  const openFeedWeightModal = (item: any) => {
    setEditingLineItem(item);
    setManualFeedWeight(item.feedWeight?.toString() || '');
    setShowFeedWeightModal(true);
  };

  const openBulkFixModal = () => {
    if (!receiptProcessingResult) return;
    
    const itemsNeedingFix = receiptProcessingResult.lineItems.filter(item => 
      item.category === 'other' || 
      (item.category === 'feed_supplies' && (!item.feedWeight || item.feedWeight === 0))
    );
    
    setBulkFixItems(itemsNeedingFix.map(item => ({
      ...item,
      newCategory: item.category,
      newFeedWeight: item.feedWeight || 0
    })));
    setShowBulkFixModal(true);
  };

  const saveManualCategory = () => {
    if (!editingLineItem || !receiptProcessingResult) return;
    
    // Update the line item in the processing result
    const updatedLineItems = receiptProcessingResult.lineItems.map(item => 
      item.id === editingLineItem.id ? { ...item, category: manualCategory } : item
    );
    
    setReceiptProcessingResult({
      ...receiptProcessingResult,
      lineItems: updatedLineItems
    });
    
    setShowManualCategoryModal(false);
    setEditingLineItem(null);
    setManualCategory('');
  };

  const saveFeedWeight = () => {
    if (!editingLineItem || !receiptProcessingResult) return;
    
    const weight = parseFloat(manualFeedWeight) || 0;
    
    // Update the line item in the processing result
    const updatedLineItems = receiptProcessingResult.lineItems.map(item => 
      item.id === editingLineItem.id ? { ...item, feedWeight: weight } : item
    );
    
    setReceiptProcessingResult({
      ...receiptProcessingResult,
      lineItems: updatedLineItems
    });
    
    setShowFeedWeightModal(false);
    setEditingLineItem(null);
    setManualFeedWeight('');
  };

  const saveBulkFix = () => {
    if (!receiptProcessingResult) return;
    
    // Update all items with their new values
    const updatedLineItems = receiptProcessingResult.lineItems.map(item => {
      const bulkItem = bulkFixItems.find(bulk => bulk.id === item.id);
      if (bulkItem) {
        return {
          ...item,
          category: bulkItem.newCategory,
          feedWeight: bulkItem.newFeedWeight
        };
      }
      return item;
    });
    
    setReceiptProcessingResult({
      ...receiptProcessingResult,
      lineItems: updatedLineItems
    });
    
    setShowBulkFixModal(false);
    setBulkFixItems([]);
  };

  const autoPopulateFromResults = () => {
    if (!receiptProcessingResult) return;
    
    Alert.alert(
      'Auto-populate Form',
      'How would you like to create expenses from these results?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Single Entry (Combined)',
          onPress: () => autoPopulateSingle()
        },
        {
          text: 'Multiple Entries (By Category)',
          onPress: () => autoPopulateMultiple()
        },
        {
          text: 'Custom Selection',
          onPress: () => openCustomSelectionModal()
        }
      ]
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log('📊 Category selected:', categoryId);
    setSelectedCategoryFilter(categoryId);
    setActiveTab('entries');
  };

  const autoPopulateSingle = () => {
    if (!receiptProcessingResult) return;
    
    const totalAmount = receiptProcessingResult.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const description = `Mixed purchase from ${receiptProcessingResult.receiptData.vendor} (${receiptProcessingResult.lineItems.length} items)`;
    
    setFormData(prev => ({
      ...prev,
      amount: totalAmount.toString(),
      description,
      vendor: receiptProcessingResult.receiptData.vendor,
      vendorLocation: receiptProcessingResult.receiptData.vendor || '',
      category: 'supplies', // Default mixed category
    }));
    
    setShowReceiptReview(false);
    setShowAddModal(true);
  };

  const autoPopulateMultiple = async () => {
    if (!receiptProcessingResult) return;
    
    try {
      // Group items by category
      const categorizedItems = receiptProcessingResult.lineItems.reduce((acc, item) => {
        const category = item.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {} as Record<string, any[]>);
      
      const categories = Object.keys(categorizedItems);
      console.log(`🏷️ Creating ${categories.length} expense entries for categories:`, categories);
      
      // Create entries for all categories
      const createdEntries = [];
      for (const category of categories) {
        const items = categorizedItems[category];
        const amount = items.reduce((sum, item) => sum + item.amount, 0);
        const description = items.length === 1 
          ? items[0].description 
          : `${items.length} ${category} items from ${receiptProcessingResult.receiptData.vendor}`;
        
        const entry: FinancialEntry = {
          id: `temp_${Date.now()}_${category}`,
          type: 'expense',
          category,
          amount,
          date: receiptProcessingResult.receiptData.date,
          description,
          vendor: receiptProcessingResult.receiptData.vendor,
          vendorLocation: receiptProcessingResult.receiptData.vendor || '',
          receiptItems: items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.amount,
            totalPrice: item.amount,
            category: item.category,
            feedWeight: item.feedWeight
          })),
          receiptMetadata: {
            receiptNumber: receiptProcessingResult.receiptData.receiptNumber,
            processingMethod: 'ai_vision',
            processingConfidence: receiptProcessingResult.processingMetrics?.ocrConfidence || 0.9,
            originalImageUrl: receiptProcessingResult.receiptData.originalImageUrl,
            feedAnalysis: receiptProcessingResult.feedAnalysis
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'current_user' // Will be set by the store
        };
        
        // Extract business intelligence data from receipt processing
        const businessIntelligence = {
          feed_type: items.some(item => item.feedWeight > 0) ? 'growth/development' : undefined,
          brand_names: [...new Set(items.flatMap(item => 
            item.description.match(/JACOBY'?S|PURINA|WEAVER|KENT|NUTRENA/gi) || []
          ).map(brand => brand.toUpperCase()))],
          equipment_purchased: items.filter(item => 
            /FEEDER|SCOOP|BRUSH|HALTER|LEAD|BUCKET/i.test(item.description)
          ).map(item => item.description),
          seasonal_indicator: receiptProcessingResult.receiptData.date ? 
            getSeasonFromDate(receiptProcessingResult.receiptData.date) : 'unknown',
          purchase_pattern: items.length > 2 ? 'bulk_purchase' : 'single_purchase',
          supplier_loyalty: 'new_vendor' // Would be enhanced with user history
        };

        // Extract detailed vendor information from OCR text
        const ocrText = receiptProcessingResult.receiptData.ocrText || '';
        const vendorIntelligence = {
          vendor_category: category === 'feed_supplies' ? 'feed_pet_supply' : 'equipment_farm',
          payment_method: 'Debit Purchase',
          item_count: items.length,
          // Extract detailed vendor information from receipt OCR
          vendor_address: extractVendorAddress(ocrText),
          vendor_phone: extractVendorPhone(ocrText),
          vendor_website: extractVendorWebsite(ocrText),
          invoice_number: receiptProcessingResult.receiptData.receiptNumber || extractInvoiceNumber(ocrText),
          transaction_time: extractTransactionTime(ocrText),
          tax_amount: extractTaxAmount(ocrText),
          tax_rate: extractTaxRate(ocrText),
          employee_name: extractEmployeeName(ocrText),
          cashier_id: extractCashierId(ocrText)
        };

        console.log(`💰 Creating expense entry for ${category}: $${amount}`, { businessIntelligence, vendorIntelligence });
        
        // Add business intelligence to entry metadata
        entry.receiptMetadata = {
          ...entry.receiptMetadata,
          businessIntelligence,
          vendorIntelligence
        };
        
        await addEntry(entry);
        createdEntries.push({ category, amount, description });
      }
      
      // Show success message
      const categoryList = createdEntries.map(e => `• ${e.category}: $${e.amount.toFixed(2)}`).join('\n');
      Alert.alert(
        '✅ Multiple Entries Created',
        `Successfully created ${createdEntries.length} expense entries:\n\n${categoryList}`,
        [{ text: 'OK' }]
      );
      
      setShowReceiptReview(false);
      
    } catch (error) {
      console.error('❌ Failed to create multiple entries:', error);
      Alert.alert(
        'Error',
        'Failed to create multiple entries. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const openCustomSelectionModal = () => {
    // TODO: Implement custom selection modal
    Alert.alert('Custom Selection', 'Custom selection feature coming soon!');
  };

  const processReceiptWithAI = async (imageUri: string) => {
    console.log('🤖 Starting AI receipt processing...');
    console.log('📄 Processing image:', imageUri);
    
    try {
      setIsProcessingReceipt(true);
      
      const processingRequest = {
        imageUrl: imageUri,
        userId: user?.id || 'unknown-user',
        processingOptions: {
          extractFeedWeights: true,
          categorizeLineItems: true,
          validateWithDatabase: true,
          confidenceThreshold: 0.7
        }
      };
      
      console.log('📊 Processing request:', processingRequest);
      
      const result = await aiReceiptProcessor.processReceipt(processingRequest);
      setReceiptProcessingResult(result);
      
      console.log('✅ Processing complete!');
      console.log(`📋 Found ${result.lineItems.length} items in ${result.suggestedExpenses.length} categories`);
      
      // Show comprehensive processing results
      const feedInfo = result.feedAnalysis && result.feedAnalysis.totalFeedWeight > 0 
        ? `\n🌾 Feed Analysis: ${result.feedAnalysis.totalFeedWeight}lbs for $${result.feedAnalysis.estimatedFeedCost.toFixed(2)}` 
        : '';
      
      const warningsInfo = result.warnings && result.warnings.length > 0 
        ? `\n⚠️ ${result.warnings.length} warnings to review` 
        : '';
      
      // Show processing results in the form - no popup needed
      console.log('✅ Processing complete, results available in form');
      
      // Optional: Show a brief completion feedback
      setTimeout(() => {
        Alert.alert(
          '🎉 Receipt Processed Successfully!',
          `Found ${result.lineItems.length} items in ${result.suggestedExpenses.length} categories${feedInfo}\n\nReady to review results or continue manually.`,
          [{ text: 'Got it!' }]
        );
      }, 500);
      
    } catch (error) {
      console.error('❌ Receipt processing error:', error);
      Alert.alert(
        '❌ Processing Failed',
        'Unable to process receipt automatically. You can still:\n\n• Enter expenses manually\n• Try processing again\n• Use the manual category selection\n\nThe receipt photo has been saved for your records.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingReceipt(false);
      console.log('🏁 Processing workflow complete');
    }
  };

  const createExpensesFromReceipt = async () => {
    if (!receiptProcessingResult) return;
    
    try {
      for (const suggestedExpense of receiptProcessingResult.suggestedExpenses) {
        // Convert line items to receipt items format
        const receiptItems = suggestedExpense.lineItems?.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.amount,
          totalPrice: item.amount,
          category: item.category,
          feedWeight: item.feedWeight
        }));
        
        const receiptMetadata = {
          receiptNumber: receiptProcessingResult.receiptData.receiptNumber,
          processingMethod: 'ai_vision' as const,
          processingConfidence: receiptProcessingResult.receiptData.aiConfidence,
          originalImageUrl: receiptProcessingResult.receiptData.originalImageUrl,
          feedAnalysis: receiptProcessingResult.feedAnalysis ? {
            totalFeedWeight: receiptProcessingResult.feedAnalysis.totalFeedWeight,
            feedTypes: receiptProcessingResult.feedAnalysis.feedTypes?.map(f => f.name) || [],
            estimatedDaysSupply: receiptProcessingResult.feedAnalysis.feedEfficiencyPredictions?.daysOfFeedSupply || 0
          } : undefined
        };
        
        await addEntry({
          type: 'expense',
          category: suggestedExpense.category,
          subcategory: suggestedExpense.subcategory,
          amount: suggestedExpense.amount,
          date: suggestedExpense.date,
          description: suggestedExpense.description,
          animalId: suggestedExpense.animalId,
          userId: user?.id || 'unknown-user',
          attachments: suggestedExpense.receiptPhoto ? [suggestedExpense.receiptPhoto] : undefined,
          tags: suggestedExpense.notes ? [suggestedExpense.notes] : undefined,
          vendor: suggestedExpense.vendor,
          vendorLocation: receiptProcessingResult.receiptData?.vendor || '',
          receiptItems,
          receiptMetadata
        });
      }
      
      Alert.alert(
        'Expenses Created! ✅',
        `Successfully created ${receiptProcessingResult.suggestedExpenses.length} expense entries.\n\nWould you like to:`,
        [
          { 
            text: 'View Entries', 
            onPress: () => {
              // Close all modals and go to entries tab
              setShowReceiptReview(false);
              setReceiptProcessingResult(null);
              setShowAddModal(false);
              resetForm();
              setActiveTab('entries');
            }
          },
          { 
            text: 'Add Another Entry', 
            onPress: () => {
              // Close receipt review but stay in add modal
              setShowReceiptReview(false);
              setReceiptProcessingResult(null);
              // Keep add modal open for another entry
              resetForm();
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create expenses. Please try again.');
      console.error('Error creating expenses:', error);
    }
  };

  const handleAddEntry = async () => {
    console.log('💾 Starting handleAddEntry...');
    console.log('📋 Form data:', formData);
    console.log('📸 Receipt photo:', formData.receiptPhoto ? 'HAS PHOTO' : 'NO PHOTO');
    console.log('🤖 AI processing result:', receiptProcessingResult ? 'HAS RESULTS' : 'NO RESULTS');
    
    if (!formData.category || !formData.amount || !formData.description) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      // Convert receipt processing results to receipt items and metadata
      let receiptItems = undefined;
      let receiptMetadata = undefined;
      
      if (receiptProcessingResult) {
        receiptItems = receiptProcessingResult.lineItems.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.amount,
          totalPrice: item.amount,
          category: item.category,
          feedWeight: item.feedWeight
        }));
        
        receiptMetadata = {
          receiptNumber: receiptProcessingResult.receiptData.receiptNumber,
          processingMethod: 'ai_vision' as const,
          processingConfidence: receiptProcessingResult.receiptData.aiConfidence,
          originalImageUrl: receiptProcessingResult.receiptData.originalImageUrl,
          feedAnalysis: receiptProcessingResult.feedAnalysis ? {
            totalFeedWeight: receiptProcessingResult.feedAnalysis.totalFeedWeight,
            feedTypes: receiptProcessingResult.feedAnalysis.feedTypes?.map(f => f.name) || [],
            estimatedDaysSupply: receiptProcessingResult.feedAnalysis.feedEfficiencyPredictions?.daysOfFeedSupply || 0
          } : undefined
        };
      }
      
      const entryData = {
        type: formData.type,
        category: formData.category,
        subcategory: formData.subcategory,
        amount,
        date: formData.date,
        description: formData.description,
        tags: formData.tags,
        attachments: formData.receiptPhoto ? [formData.receiptPhoto] : [],
        vendor: formData.vendor || (receiptProcessingResult?.receiptData?.vendor),
        vendorLocation: formData.vendorLocation,
        receiptItems,
        receiptMetadata,
        userId: user?.id || 'unknown-user',
      };

      console.log('📝 Entry data to save:', entryData);

      if (editingEntry) {
        // Update existing entry
        console.log('✏️ Updating existing entry:', editingEntry.id);
        await updateEntry(editingEntry.id, entryData);
      } else {
        // Create new entry
        console.log('➕ Creating new entry');
        await addEntry(entryData);
      }

      console.log('✅ Entry saved successfully!');
      
      Alert.alert(
        'Success! 🎉',
        `${editingEntry ? 'Updated' : 'Created'} entry successfully${formData.receiptPhoto ? ' with receipt photo' : ''}`,
        [{ text: 'OK' }]
      );

      // Reset form
      resetForm();
      setShowAddModal(false);
      
    } catch (error) {
      console.error('❌ Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
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
              <View style={styles.incomeBreakdown}>
                <Text style={styles.actualIncomeText}>Actual: ${summary.actualIncome.toFixed(2)}</Text>
                {summary.predictedIncome.amount > 0 && (
                  <Text style={styles.predictedIncomeText}>
                    Projected: ${summary.predictedIncome.amount.toFixed(2)}
                  </Text>
                )}
              </View>
              {summary.predictedIncome.amount > 0 && (
                <Text style={styles.saeNote}>{summary.predictedIncome.note}</Text>
              )}
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
            <TouchableOpacity 
              key={index} 
              style={styles.modernCategoryItem}
              onPress={() => handleCategorySelect(cat.category)}
              activeOpacity={0.7}
            >
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
              <View style={styles.categoryChevron}>
                <Text style={styles.chevronText}>›</Text>
              </View>
            </TouchableOpacity>
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

  const renderEntriesTab = () => {
    // Filter entries based on selected category
    const filteredEntries = selectedCategoryFilter 
      ? entries.filter(entry => entry.category === selectedCategoryFilter)
      : entries;

    const selectedCategory = selectedCategoryFilter 
      ? EXPENSE_CATEGORIES.find(c => c.id === selectedCategoryFilter)
      : null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Header Section */}
        <View style={styles.modernTabHeader}>
          <Text style={styles.modernTabTitle}>
            {selectedCategory ? `${selectedCategory.name} Entries` : 'Financial Entries'}
          </Text>
          <Text style={styles.modernTabSubtitle}>
            {selectedCategory 
              ? `Showing ${filteredEntries.length} entries for ${selectedCategory.name}`
              : 'Track your income and expenses'
            }
          </Text>
          
          {/* Category Filter Badge */}
          {selectedCategory && (
            <View style={styles.categoryFilterBadge}>
              <Text style={styles.categoryFilterIcon}>{selectedCategory.icon}</Text>
              <Text style={styles.categoryFilterText}>{selectedCategory.name}</Text>
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => setSelectedCategoryFilter(null)}
              >
                <Text style={styles.clearFilterText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {filteredEntries.length === 0 ? (
        <View style={styles.modernEmptyState}>
          <View style={styles.modernEmptyIcon}>
            <Text style={styles.modernEmptyIconText}>💸</Text>
          </View>
          <Text style={styles.modernEmptyTitle}>
            {selectedCategory ? `No ${selectedCategory.name} entries yet` : 'No entries yet'}
          </Text>
          <Text style={styles.modernEmptySubtitle}>
            {selectedCategory 
              ? `No entries found for ${selectedCategory.name} category`
              : 'Start tracking your income and expenses to see them here'
            }
          </Text>
          <TouchableOpacity 
            style={styles.modernEmptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.modernEmptyButtonText}>Add Your First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.modernEntriesContainer}>
          {filteredEntries
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .map((entry) => {
              const category = entry.type === 'income' 
                ? INCOME_CATEGORIES.find(c => c.id === entry.category)
                : EXPENSE_CATEGORIES.find(c => c.id === entry.category);
                
              return (
                <View key={entry.id} style={styles.modernEntryCard}>
                  <View style={styles.modernEntryHeader}>
                    <View style={styles.modernEntryIconContainer}>
                      <Text style={styles.modernEntryIcon}>{category?.icon || '💰'}</Text>
                    </View>
                    <View style={styles.modernEntryInfo}>
                      <Text style={styles.modernEntryDescription}>{entry.description}</Text>
                      <Text style={styles.modernEntryCategory}>{category?.name || entry.category}</Text>
                      <Text style={styles.modernEntryDate}>
                        {entry.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.modernEntryAmountContainer}>
                      <Text style={[
                        styles.modernEntryAmount,
                        entry.type === 'income' ? styles.modernIncomeAmount : styles.modernExpenseAmount
                      ]}>
                        {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                      </Text>
                      <View style={[
                        styles.modernEntryTypeBadge,
                        entry.type === 'income' ? styles.modernIncomeBadge : styles.modernExpenseBadge
                      ]}>
                        <Text style={styles.modernEntryTypeBadgeText}>
                          {entry.type === 'income' ? 'Income' : 'Expense'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modernEntryActions}>
                    <TouchableOpacity 
                      style={styles.modernViewButton}
                      onPress={() => {
                        setViewingEntry(entry);
                        setShowEntryView(true);
                      }}
                    >
                      <Text style={styles.modernViewButtonText}>👁️ View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modernEditButton}
                      onPress={() => openEditModal(entry)}
                    >
                      <Text style={styles.modernEditButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.modernDeleteButton}
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
                      <Text style={styles.modernDeleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          }
        </View>
      )}
    </ScrollView>
    );
  };

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
        {/* Modern Header Section */}
        <View style={styles.modernTabHeader}>
          <Text style={styles.modernTabTitle}>Feed Analytics</Text>
          <Text style={styles.modernTabSubtitle}>Track feed efficiency and costs</Text>
        </View>

        {/* Modern Feed Performance Dashboard */}
        <View style={styles.modernFeedDashboard}>
          <View style={styles.modernFeedHeader}>
            <Text style={styles.modernFeedTitle}>📊 Feed Performance Overview</Text>
            <Text style={styles.modernFeedSubtitle}>Monthly insights and recommendations</Text>
          </View>
          
          {/* Modern Key Metrics */}
          <View style={styles.modernKeyMetricsSection}>
            <Text style={styles.modernSectionTitle}>Key Performance Metrics</Text>
            
            <View style={styles.modernMetricsGrid}>
              <View style={styles.modernMetricCard}>
                <View style={styles.modernMetricIcon}>
                  <Text style={styles.modernMetricIconText}>💰</Text>
                </View>
                <Text style={styles.modernMetricValue}>${sampleMetrics.dailyFeedCost}</Text>
                <Text style={styles.modernMetricLabel}>Daily Feed Cost</Text>
              </View>
              
              <View style={styles.modernMetricCard}>
                <View style={styles.modernMetricIcon}>
                  <Text style={styles.modernMetricIconText}>⚖️</Text>
                </View>
                <Text style={styles.modernMetricValue}>+{Math.round(sampleMetrics.dailyWeightGain * 30)} lbs</Text>
                <Text style={styles.modernMetricLabel}>Monthly Weight Gain</Text>
              </View>
              
              <View style={styles.modernMetricCard}>
                <View style={styles.modernMetricIcon}>
                  <Text style={styles.modernMetricIconText}>🏆</Text>
                </View>
                <Text style={styles.modernMetricValue}>${sampleMetrics.costPerLbGain}</Text>
                <Text style={styles.modernMetricLabel}>Cost per Pound Gained</Text>
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
        <View style={styles.modernChartSection}>
          <Text style={styles.modernSectionTitle}>📊 Cost by Feed Brand</Text>
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
        <View style={styles.modernChartSection}>
          <Text style={styles.modernSectionTitle}>📝 Recent Feed Tracking</Text>
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
                              userId: user?.id || 'unknown-user'
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
        {/* Modern Header Section */}
        <View style={styles.modernTabHeader}>
          <Text style={styles.modernTabTitle}>AET Skills Assessment</Text>
          <Text style={styles.modernTabSubtitle}>Track your agricultural education progress</Text>
        </View>

        {/* Modern Skills Overview */}
        <View style={styles.modernAETDashboard}>
          <View style={styles.modernAETHeader}>
            <Text style={styles.modernAETTitle}>🎓 Financial Skills Progress</Text>
            <Text style={styles.modernAETSubtitle}>Build essential agricultural business skills</Text>
          </View>
          
          {/* Modern Skills Progress */}
          <View style={styles.modernSkillsContainer}>
            <View style={styles.modernSkillCard}>
              <View style={styles.modernSkillHeader}>
                <View style={styles.modernSkillIconContainer}>
                  <Text style={styles.modernSkillIcon}>📊</Text>
                </View>
                <View style={styles.modernSkillInfo}>
                  <Text style={styles.modernSkillName}>Record Keeping</Text>
                  <Text style={styles.modernSkillDescription}>Track all income and expenses accurately</Text>
                </View>
                <View style={styles.modernSkillScoreContainer}>
                  <Text style={styles.modernSkillScore}>{aetSkills.recordKeeping}%</Text>
                </View>
              </View>
              <View style={styles.modernProgressBar}>
                <View style={[styles.modernProgressFill, { width: `${aetSkills.recordKeeping}%` }]} />
              </View>
            </View>

            <View style={styles.modernSkillCard}>
              <View style={styles.modernSkillHeader}>
                <View style={styles.modernSkillIconContainer}>
                  <Text style={styles.modernSkillIcon}>💰</Text>
                </View>
                <View style={styles.modernSkillInfo}>
                  <Text style={styles.modernSkillName}>Budgeting</Text>
                  <Text style={styles.modernSkillDescription}>Create and maintain budgets for your SAE</Text>
                </View>
                <View style={styles.modernSkillScoreContainer}>
                  <Text style={styles.modernSkillScore}>{aetSkills.budgeting}%</Text>
                </View>
              </View>
              <View style={styles.modernProgressBar}>
                <View style={[styles.modernProgressFill, { width: `${aetSkills.budgeting}%` }]} />
              </View>
            </View>

            <View style={styles.modernSkillCard}>
              <View style={styles.modernSkillHeader}>
                <View style={styles.modernSkillIconContainer}>
                  <Text style={styles.modernSkillIcon}>📈</Text>
                </View>
                <View style={styles.modernSkillInfo}>
                  <Text style={styles.modernSkillName}>Profit Analysis</Text>
                  <Text style={styles.modernSkillDescription}>Analyze profitability and ROI</Text>
                </View>
                <View style={styles.modernSkillScoreContainer}>
                  <Text style={styles.modernSkillScore}>{aetSkills.profitAnalysis}%</Text>
                </View>
              </View>
              <View style={styles.modernProgressBar}>
                <View style={[styles.modernProgressFill, { width: `${aetSkills.profitAnalysis}%` }]} />
              </View>
            </View>

            <View style={styles.modernSkillCard}>
              <View style={styles.modernSkillHeader}>
                <View style={styles.modernSkillIconContainer}>
                  <Text style={styles.modernSkillIcon}>🎯</Text>
                </View>
                <View style={styles.modernSkillInfo}>
                  <Text style={styles.modernSkillName}>Marketing Skills</Text>
                  <Text style={styles.modernSkillDescription}>Document marketing strategies and outcomes</Text>
                </View>
                <View style={styles.modernSkillScoreContainer}>
                  <Text style={styles.modernSkillScore}>{aetSkills.marketingSkills}%</Text>
                </View>
              </View>
              <View style={styles.modernProgressBar}>
                <View style={[styles.modernProgressFill, { width: `${aetSkills.marketingSkills}%` }]} />
              </View>
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

  const renderAddModal = () => {
    console.log('🎭 Rendering add modal, visible:', showAddModal);
    console.log('📸 Receipt photo state:', formData.receiptPhoto ? 'HAS PHOTO' : 'NO PHOTO');
    console.log('🤖 Processing result:', receiptProcessingResult ? 'HAS RESULTS' : 'NO RESULTS');
    
    // Debug: Log full form data
    if (formData.receiptPhoto) {
      console.log('📄 Receipt photo URI:', formData.receiptPhoto);
    }
    
    return (
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
                  : Object.values(EXPENSE_CATS).map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }))
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
                    
                    {/* AI Processing Status */}
                    {isProcessingReceipt && (
                      <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={styles.processingText}>🤖 Analyzing receipt...</Text>
                        <Text style={styles.processingSubtext}>Extracting items and categories</Text>
                      </View>
                    )}
                    
                    {/* Processing Results */}
                    {receiptProcessingResult && (
                      <View style={styles.processingResults}>
                        <Text style={styles.processingResultsTitle}>AI Processing Results:</Text>
                        <Text style={styles.processingResultsText}>
                          • {receiptProcessingResult.lineItems.length} items found
                        </Text>
                        <Text style={styles.processingResultsText}>
                          • {receiptProcessingResult.suggestedExpenses.length} categories detected
                        </Text>
                        {receiptProcessingResult.feedAnalysis && (
                          <Text style={styles.processingResultsText}>
                            • {receiptProcessingResult.feedAnalysis.totalFeedWeight}lbs feed detected
                          </Text>
                        )}
                        <TouchableOpacity 
                          style={styles.reviewButton}
                          onPress={() => {
                            console.log('📋 Review & Create Expenses button pressed');
                            console.log('🤖 Current processing result:', receiptProcessingResult);
                            console.log('🎭 Setting showReceiptReview to true');
                            
                            // Hide add modal to avoid conflicts
                            setShowAddModal(false);
                            setShowReceiptReview(true);
                          }}
                        >
                          <Text style={styles.reviewButtonText}>Review & Create Expenses</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <View style={styles.receiptPhotoActions}>
                      {/* AI Processing Button */}
                      {!receiptProcessingResult && (
                        <TouchableOpacity 
                          style={styles.aiProcessButton}
                          onPress={() => processReceiptWithAI(formData.receiptPhoto!)}
                        >
                          <Text style={styles.aiProcessButtonText}>🤖 AI Process Receipt</Text>
                        </TouchableOpacity>
                      )}
                      
                      <View style={styles.photoActionButtons}>
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
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.addPhotoButton}
                    onPress={showImagePickerOptions}
                  >
                    <Text style={styles.addPhotoIcon}>📷</Text>
                    <Text style={styles.addPhotoText}>Add Receipt Photo</Text>
                    <Text style={styles.addPhotoSubtext}>
                      Tap to take a photo or choose from library
                    </Text>
                    <View style={styles.aiFeaturesBadge}>
                      <Text style={styles.aiFeaturesBadgeText}>🤖 AI POWERED</Text>
                    </View>
                    <Text style={styles.addPhotoAIText}>
                      ✨ Auto-categorize • Extract feed weights • Create multiple expenses
                    </Text>
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
  };

  const renderReceiptReviewModal = () => {
    console.log('🎭 Rendering receipt review modal, visible:', showReceiptReview);
    console.log('🤖 Receipt processing result exists:', !!receiptProcessingResult);
    
    return (
      <Modal
        visible={showReceiptReview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowReceiptReview(false)}
        presentationStyle="overFullScreen"
      >
      <View style={[styles.modalOverlay, styles.receiptReviewOverlay]}>
        <View style={[styles.modalContent, styles.receiptReviewContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🤖 AI Receipt Processing Results</Text>
            <TouchableOpacity onPress={() => {
              console.log('❌ Close button pressed in receipt review');
              setShowReceiptReview(false);
            }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {receiptProcessingResult && (
              <>
                {/* Processing Summary */}
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>Processing Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Items:</Text>
                    <Text style={styles.summaryValue}>{receiptProcessingResult.lineItems.length}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Categories:</Text>
                    <Text style={styles.summaryValue}>{receiptProcessingResult.suggestedExpenses.length}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Confidence:</Text>
                    <Text style={styles.summaryValue}>
                      {(receiptProcessingResult.processingMetrics.categorizationConfidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                  {receiptProcessingResult.feedAnalysis && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Feed Weight:</Text>
                      <Text style={styles.summaryValue}>
                        {receiptProcessingResult.feedAnalysis.totalFeedWeight}lbs
                      </Text>
                    </View>
                  )}
                </View>

                {/* Suggested Expenses */}
                <View style={styles.expensesSection}>
                  <Text style={styles.modernSectionTitle}>Suggested Expenses</Text>
                  {receiptProcessingResult.suggestedExpenses.map((expense, index) => {
                    const categoryInfo = Object.values(EXPENSE_CATS).find(cat => cat.id === expense.category);
                    return (
                      <View key={index} style={styles.expensePreview}>
                        <View style={styles.expenseHeader}>
                          <Text style={styles.expenseIcon}>{categoryInfo?.icon || '💰'}</Text>
                          <View style={styles.expenseInfo}>
                            <Text style={styles.expenseTitle}>{categoryInfo?.name || expense.category}</Text>
                            <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                          </View>
                        </View>
                        <Text style={styles.expenseDescription}>{expense.description}</Text>
                        {expense.lineItems && (
                          <View style={styles.lineItemsList}>
                            {expense.lineItems.map((item, itemIndex) => (
                              <View key={itemIndex} style={styles.lineItemRow}>
                                <Text style={styles.lineItemDescription}>{item.description}</Text>
                                <Text style={styles.lineItemAmount}>${item.amount.toFixed(2)}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Feed Analysis */}
                {receiptProcessingResult.feedAnalysis && (
                  <View style={styles.feedAnalysisSection}>
                    <Text style={styles.modernSectionTitle}>Feed Analysis</Text>
                    <View style={styles.feedSummary}>
                      <View style={styles.feedSummaryRow}>
                        <Text style={styles.feedSummaryLabel}>Total Feed Weight:</Text>
                        <Text style={styles.feedSummaryValue}>
                          {receiptProcessingResult.feedAnalysis.totalFeedWeight}lbs
                        </Text>
                      </View>
                      <View style={styles.feedSummaryRow}>
                        <Text style={styles.feedSummaryLabel}>Estimated Cost:</Text>
                        <Text style={styles.feedSummaryValue}>
                          ${receiptProcessingResult.feedAnalysis.estimatedFeedCost.toFixed(2)}
                        </Text>
                      </View>
                      {receiptProcessingResult.feedAnalysis.feedEfficiencyPredictions && (
                        <View style={styles.feedSummaryRow}>
                          <Text style={styles.feedSummaryLabel}>Days Supply:</Text>
                          <Text style={styles.feedSummaryValue}>
                            {receiptProcessingResult.feedAnalysis.feedEfficiencyPredictions.daysOfFeedSupply} days
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Enhanced Warnings with Manual Input */}
                {receiptProcessingResult.warnings && receiptProcessingResult.warnings.length > 0 && (
                  <View style={styles.warningsSection}>
                    <Text style={styles.warningsTitle}>⚠️ Items Need Review</Text>
                    
                    {/* Uncategorized Items */}
                    {receiptProcessingResult.lineItems.filter(item => item.category === 'other').length > 0 && (
                      <View style={styles.warningGroup}>
                        <Text style={styles.warningGroupTitle}>Uncategorized Items</Text>
                        {receiptProcessingResult.lineItems.filter(item => item.category === 'other').map((item, index) => (
                          <View key={index} style={styles.warningItemRow}>
                            <View style={styles.warningItemInfo}>
                              <Text style={styles.warningItemDescription}>{item.description}</Text>
                              <Text style={styles.warningItemAmount}>${item.amount.toFixed(2)}</Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.fixItemButton}
                              onPress={() => openManualCategoryModal(item)}
                            >
                              <Text style={styles.fixItemButtonText}>Fix</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Feed Items Missing Weight */}
                    {receiptProcessingResult.lineItems.filter(item => 
                      item.category === 'feed_supplies' && (!item.feedWeight || item.feedWeight === 0)
                    ).length > 0 && (
                      <View style={styles.warningGroup}>
                        <Text style={styles.warningGroupTitle}>Feed Items Missing Weight</Text>
                        {receiptProcessingResult.lineItems.filter(item => 
                          item.category === 'feed_supplies' && (!item.feedWeight || item.feedWeight === 0)
                        ).map((item, index) => (
                          <View key={index} style={styles.warningItemRow}>
                            <View style={styles.warningItemInfo}>
                              <Text style={styles.warningItemDescription}>{item.description}</Text>
                              <Text style={styles.warningItemAmount}>${item.amount.toFixed(2)}</Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.fixItemButton}
                              onPress={() => openFeedWeightModal(item)}
                            >
                              <Text style={styles.fixItemButtonText}>Add Weight</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Fix All Button */}
                    <TouchableOpacity 
                      style={styles.fixAllButton}
                      onPress={() => openBulkFixModal()}
                    >
                      <Text style={styles.fixAllButtonText}>🔧 Fix All Issues</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {/* Auto-populate Options */}
            <TouchableOpacity 
              style={[styles.modalButton, styles.autoPopulateButton]}
              onPress={() => autoPopulateFromResults()}
            >
              <Text style={styles.autoPopulateButtonText}>📋 Auto-populate Form</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                console.log('❌ Cancel button pressed in receipt review');
                Alert.alert(
                  'Cancel Receipt Processing',
                  'What would you like to do?',
                  [
                    { text: 'Back to Review', style: 'cancel' },
                    { 
                      text: 'Continue Adding Entry', 
                      onPress: () => {
                        setShowReceiptReview(false);
                        setShowAddModal(true);
                      }
                    },
                    { 
                      text: 'Discard & Close', 
                      style: 'destructive',
                      onPress: () => {
                        setShowReceiptReview(false);
                        setReceiptProcessingResult(null);
                        setShowAddModal(false);
                        resetForm();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                console.log('✅ Create Expenses button pressed');
                createExpensesFromReceipt();
              }}
            >
              <Text style={styles.saveButtonText}>Create Expenses</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    );
  };

  const renderEntryViewModal = () => (
    <Modal
      visible={showEntryView}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEntryView(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Entry Details</Text>
            <TouchableOpacity onPress={() => setShowEntryView(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {viewingEntry && (
              <>
                {/* Entry Header */}
                <View style={styles.entryViewHeader}>
                  <View style={styles.entryViewIconContainer}>
                    <Text style={styles.entryViewIcon}>
                      {viewingEntry.type === 'income' 
                        ? INCOME_CATEGORIES.find(c => c.id === viewingEntry.category)?.icon || '💰'
                        : EXPENSE_CATEGORIES.find(c => c.id === viewingEntry.category)?.icon || '💸'
                      }
                    </Text>
                  </View>
                  <View style={styles.entryViewInfo}>
                    <Text style={styles.entryViewDescription}>{viewingEntry.description}</Text>
                    <Text style={styles.entryViewAmount}>
                      {viewingEntry.type === 'income' ? '+' : '-'}${viewingEntry.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Entry Details */}
                <View style={styles.entryDetailsSection}>
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>Type:</Text>
                    <Text style={styles.entryDetailValue}>
                      {viewingEntry.type === 'income' ? '💰 Income' : '💸 Expense'}
                    </Text>
                  </View>
                  
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>Category:</Text>
                    <Text style={styles.entryDetailValue}>
                      {viewingEntry.type === 'income' 
                        ? INCOME_CATEGORIES.find(c => c.id === viewingEntry.category)?.name || viewingEntry.category
                        : EXPENSE_CATEGORIES.find(c => c.id === viewingEntry.category)?.name || viewingEntry.category
                      }
                    </Text>
                  </View>
                  
                  {viewingEntry.subcategory && (
                    <View style={styles.entryDetailRow}>
                      <Text style={styles.entryDetailLabel}>Subcategory:</Text>
                      <Text style={styles.entryDetailValue}>{viewingEntry.subcategory}</Text>
                    </View>
                  )}
                  
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>Date:</Text>
                    <Text style={styles.entryDetailValue}>
                      {viewingEntry.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>Created:</Text>
                    <Text style={styles.entryDetailValue}>
                      {viewingEntry.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  {/* Vendor Information */}
                  {viewingEntry.vendor && (
                    <View style={styles.entryDetailRow}>
                      <Text style={styles.entryDetailLabel}>Vendor:</Text>
                      <Text style={styles.entryDetailValue}>
                        {viewingEntry.vendor}
                        {viewingEntry.vendorLocation && (
                          <Text style={styles.vendorLocation}>
                            {' '}({viewingEntry.vendorLocation})
                          </Text>
                        )}
                      </Text>
                    </View>
                  )}
                  
                  {/* Processing Method */}
                  {viewingEntry.receiptMetadata && (
                    <View style={styles.entryDetailRow}>
                      <Text style={styles.entryDetailLabel}>Processing:</Text>
                      <Text style={styles.entryDetailValue}>
                        {viewingEntry.receiptMetadata.processingMethod === 'ai_vision' ? '🤖 AI Vision' : 
                         viewingEntry.receiptMetadata.processingMethod === 'ai_ocr' ? '🤖 AI OCR' : 
                         '✏️ Manual Entry'}
                        {viewingEntry.receiptMetadata.processingConfidence && (
                          <Text style={styles.confidenceText}>
                            {' '}({Math.round(viewingEntry.receiptMetadata.processingConfidence * 100)}% confidence)
                          </Text>
                        )}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Receipt Items Breakdown */}
                {viewingEntry.receiptItems && viewingEntry.receiptItems.length > 0 && (
                  <View style={styles.receiptItemsSection}>
                    <Text style={styles.receiptItemsSectionTitle}>📋 Receipt Items</Text>
                    <View style={styles.receiptItemsList}>
                      {viewingEntry.receiptItems.map((item, index) => (
                        <View key={item.id || index} style={styles.receiptItemRow}>
                          <View style={styles.receiptItemInfo}>
                            <Text style={styles.receiptItemDescription}>
                              {item.description}
                              {item.quantity > 1 && (
                                <Text style={styles.receiptItemQuantity}> (x{item.quantity})</Text>
                              )}
                            </Text>
                            {item.feedWeight && item.feedWeight > 0 && (
                              <Text style={styles.receiptItemFeedWeight}>
                                🌾 {item.feedWeight}lbs
                              </Text>
                            )}
                            {item.category && item.category !== 'other' && (
                              <Text style={styles.receiptItemCategory}>
                                {EXPENSE_CATEGORIES.find(c => c.id === item.category)?.name || item.category}
                              </Text>
                            )}
                          </View>
                          <View style={styles.receiptItemPricing}>
                            {item.quantity > 1 && (
                              <Text style={styles.receiptItemUnitPrice}>
                                ${item.unitPrice.toFixed(2)} each
                              </Text>
                            )}
                            <Text style={styles.receiptItemTotalPrice}>
                              ${item.totalPrice.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                    
                    {/* Feed Analysis Summary */}
                    {viewingEntry.receiptMetadata?.feedAnalysis && (
                      <View style={styles.feedAnalysisSection}>
                        <Text style={styles.feedAnalysisTitle}>🌾 Feed Analysis</Text>
                        <View style={styles.feedAnalysisStats}>
                          <View style={styles.feedAnalysisStat}>
                            <Text style={styles.feedAnalysisLabel}>Total Feed Weight:</Text>
                            <Text style={styles.feedAnalysisValue}>
                              {viewingEntry.receiptMetadata.feedAnalysis.totalFeedWeight}lbs
                            </Text>
                          </View>
                          {viewingEntry.receiptMetadata.feedAnalysis.estimatedDaysSupply > 0 && (
                            <View style={styles.feedAnalysisStat}>
                              <Text style={styles.feedAnalysisLabel}>Estimated Supply:</Text>
                              <Text style={styles.feedAnalysisValue}>
                                {viewingEntry.receiptMetadata.feedAnalysis.estimatedDaysSupply} days
                              </Text>
                            </View>
                          )}
                          {viewingEntry.receiptMetadata.feedAnalysis.feedTypes.length > 0 && (
                            <View style={styles.feedAnalysisStat}>
                              <Text style={styles.feedAnalysisLabel}>Feed Types:</Text>
                              <Text style={styles.feedAnalysisValue}>
                                {viewingEntry.receiptMetadata.feedAnalysis.feedTypes.join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Tags */}
                {viewingEntry.tags && viewingEntry.tags.length > 0 && (
                  <View style={styles.tagsSection}>
                    <Text style={styles.tagsSectionTitle}>Tags</Text>
                    <View style={styles.tagsList}>
                      {viewingEntry.tags.map((tag, index) => (
                        <View key={index} style={styles.tagItem}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Receipt Photo */}
                {viewingEntry.attachments && viewingEntry.attachments.length > 0 && (
                  <View style={styles.attachmentsSection}>
                    <Text style={styles.attachmentsSectionTitle}>Receipt Photo</Text>
                    <View style={styles.receiptPhotoContainer}>
                      <Image 
                        source={{ uri: viewingEntry.attachments[0] }} 
                        style={styles.receiptPhotoView}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                )}

                {/* AET Skills */}
                {viewingEntry.aetSkills && viewingEntry.aetSkills.length > 0 && (
                  <View style={styles.aetSkillsSection}>
                    <Text style={styles.aetSkillsSectionTitle}>AET Skills Practiced</Text>
                    <View style={styles.aetSkillsList}>
                      {viewingEntry.aetSkills.map((skill, index) => (
                        <Text key={index} style={styles.aetSkillItem}>• {skill}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowEntryView(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                setShowEntryView(false);
                if (viewingEntry) {
                  openEditModal(viewingEntry);
                }
              }}
            >
              <Text style={styles.saveButtonText}>Edit Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Manual Input Modal Components
  const renderManualCategoryModal = () => (
    <Modal
      visible={showManualCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowManualCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Categorize Item</Text>
            <TouchableOpacity onPress={() => setShowManualCategoryModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {editingLineItem && (
              <>
                <View style={styles.itemPreview}>
                  <Text style={styles.itemPreviewTitle}>Item to Categorize:</Text>
                  <Text style={styles.itemPreviewDescription}>{editingLineItem.description}</Text>
                  <Text style={styles.itemPreviewAmount}>${editingLineItem.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.categorySelection}>
                  <Text style={styles.categorySelectionTitle}>Select Category:</Text>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        manualCategory === category.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setManualCategory(category.id)}
                    >
                      <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryOptionText,
                        manualCategory === category.id && styles.categoryOptionTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowManualCategoryModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveManualCategory}
              disabled={!manualCategory}
            >
              <Text style={styles.saveButtonText}>Save Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderFeedWeightModal = () => (
    <Modal
      visible={showFeedWeightModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFeedWeightModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Feed Weight</Text>
            <TouchableOpacity onPress={() => setShowFeedWeightModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {editingLineItem && (
              <>
                <View style={styles.itemPreview}>
                  <Text style={styles.itemPreviewTitle}>Feed Item:</Text>
                  <Text style={styles.itemPreviewDescription}>{editingLineItem.description}</Text>
                  <Text style={styles.itemPreviewAmount}>${editingLineItem.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.weightInput}>
                  <Text style={styles.weightInputLabel}>Feed Weight (lbs):</Text>
                  <TextInput
                    style={styles.weightInputField}
                    value={manualFeedWeight}
                    onChangeText={setManualFeedWeight}
                    placeholder="Enter weight in pounds"
                    keyboardType="numeric"
                    autoFocus
                  />
                  <Text style={styles.weightInputHelp}>
                    💡 Tip: Check the package or bag for weight information
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowFeedWeightModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveFeedWeight}
              disabled={!manualFeedWeight}
            >
              <Text style={styles.saveButtonText}>Save Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBulkFixModal = () => (
    <Modal
      visible={showBulkFixModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBulkFixModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔧 Fix All Issues</Text>
            <TouchableOpacity onPress={() => setShowBulkFixModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {bulkFixItems.map((item, index) => (
              <View key={item.id} style={styles.bulkFixItem}>
                <View style={styles.bulkFixItemHeader}>
                  <Text style={styles.bulkFixItemDescription}>{item.description}</Text>
                  <Text style={styles.bulkFixItemAmount}>${item.amount.toFixed(2)}</Text>
                </View>
                
                {item.category === 'other' && (
                  <View style={styles.bulkFixField}>
                    <Text style={styles.bulkFixFieldLabel}>Category:</Text>
                    <FormPicker
                      value={item.newCategory}
                      onValueChange={(value) => {
                        const updatedItems = [...bulkFixItems];
                        updatedItems[index].newCategory = value;
                        setBulkFixItems(updatedItems);
                      }}
                      items={EXPENSE_CATEGORIES.map(cat => ({ label: cat.name, value: cat.id }))}
                      placeholder="Select category"
                      style={styles.bulkFixPicker}
                    />
                  </View>
                )}
                
                {item.category === 'feed_supplies' && (!item.feedWeight || item.feedWeight === 0) && (
                  <View style={styles.bulkFixField}>
                    <Text style={styles.bulkFixFieldLabel}>Feed Weight (lbs):</Text>
                    <TextInput
                      style={styles.bulkFixInput}
                      value={item.newFeedWeight?.toString() || ''}
                      onChangeText={(text) => {
                        const updatedItems = [...bulkFixItems];
                        updatedItems[index].newFeedWeight = parseFloat(text) || 0;
                        setBulkFixItems(updatedItems);
                      }}
                      placeholder="Enter weight"
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowBulkFixModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveBulkFix}
            >
              <Text style={styles.saveButtonText}>Save All Changes</Text>
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
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              console.log('🔄 Manual refresh triggered');
              await loadAnimals();
              await loadEntries();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshButtonIcon}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]} numberOfLines={1}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'entries' && styles.activeTab]}
          onPress={() => setActiveTab('entries')}
        >
          <Text style={[styles.tabText, activeTab === 'entries' && styles.activeTabText]} numberOfLines={1}>
            Entries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]} numberOfLines={2}>
            Feed{"\n"}Analytics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'aet' && styles.activeTab]}
          onPress={() => setActiveTab('aet')}
        >
          <Text style={[styles.tabText, activeTab === 'aet' && styles.activeTabText]} numberOfLines={2}>
            AET{"\n"}Skills
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
        onPress={() => {
          console.log('➕ Opening expense entry modal');
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {renderAddModal()}
      {renderReceiptReviewModal()}
      {renderEntryViewModal()}
      {renderManualCategoryModal()}
      {renderFeedWeightModal()}
      {renderBulkFixModal()}
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
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
    minHeight: 44,
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
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
  
  // Income Breakdown Styles
  incomeBreakdown: {
    marginBottom: 8,
  },
  actualIncomeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 2,
  },
  predictedIncomeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  saeNote: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 14,
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
  categoryChevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  // Category Filter Badge
  categoryFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  categoryFilterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 8,
  },
  clearFilterButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
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
    marginBottom: 16,
  },
  receiptPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  receiptPhotoActions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  photoActionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  changePhotoButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  changePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removePhotoButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  removePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  addPhotoAIText: {
    fontSize: 11,
    color: '#4A90E2',
    textAlign: 'center',
    fontWeight: '500',
  },
  // AI Processing Styles
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  processingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  processingResults: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  processingResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 12,
  },
  processingResultsText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  reviewButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiProcessButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#059669',
  },
  aiProcessButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Receipt Review Modal Styles
  summarySection: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  expensesSection: {
    marginBottom: 20,
  },
  expensePreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  expenseDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  lineItemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 8,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lineItemDescription: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  lineItemAmount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  feedAnalysisSection: {
    marginBottom: 20,
  },
  feedSummary: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  feedSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedSummaryLabel: {
    fontSize: 14,
    color: '#0369A1',
  },
  feedSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
  },
  warningsSection: {
    marginBottom: 20,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 4,
  },
  // Entry View Modal Styles
  viewButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 4,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  entryViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  entryViewIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  entryViewIcon: {
    fontSize: 24,
  },
  entryViewInfo: {
    flex: 1,
  },
  entryViewDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  entryViewAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  entryDetailsSection: {
    marginBottom: 20,
  },
  entryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  entryDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  entryDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tagText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  attachmentsSection: {
    marginBottom: 20,
  },
  attachmentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  receiptPhotoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptPhotoView: {
    width: '100%',
    height: 200,
    backgroundColor: '#F9FAFB',
  },
  aetSkillsSection: {
    marginBottom: 20,
  },
  aetSkillsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  aetSkillsList: {
    gap: 4,
  },
  aetSkillItem: {
    fontSize: 14,
    color: '#374151',
    paddingLeft: 8,
  },
  // Receipt Review Modal specific styles
  receiptReviewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  receiptReviewContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  // Modern Tab Styles
  modernTabHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modernTabTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernTabSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  // Modern Empty State
  modernEmptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernEmptyIconText: {
    fontSize: 40,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modernEmptyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modernEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modern Entries Container
  modernEntriesContainer: {
    gap: 12,
  },
  modernEntryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  modernEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernEntryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernEntryIcon: {
    fontSize: 24,
  },
  modernEntryInfo: {
    flex: 1,
  },
  modernEntryDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernEntryCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  modernEntryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modernEntryAmountContainer: {
    alignItems: 'flex-end',
  },
  modernEntryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modernIncomeAmount: {
    color: '#10B981',
  },
  modernExpenseAmount: {
    color: '#EF4444',
  },
  modernEntryTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modernIncomeBadge: {
    backgroundColor: '#D1FAE5',
  },
  modernExpenseBadge: {
    backgroundColor: '#FEE2E2',
  },
  modernEntryTypeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  // Modern Entry Actions
  modernEntryActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modernViewButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modernViewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modernEditButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modernEditButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modernDeleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modernDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modern Feed Analytics Styles
  modernFeedDashboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modernFeedHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modernFeedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernFeedSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modernKeyMetricsSection: {
    marginBottom: 24,
  },
  modernMetricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  modernMetricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernMetricIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modernMetricIconText: {
    fontSize: 20,
  },
  modernMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modern AET Skills Styles
  modernAETDashboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modernAETHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modernAETTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modernAETSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  modernSkillsContainer: {
    gap: 16,
  },
  modernSkillCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernSkillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernSkillIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modernSkillIcon: {
    fontSize: 18,
  },
  modernSkillInfo: {
    flex: 1,
  },
  modernSkillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  modernSkillDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  modernSkillScoreContainer: {
    alignItems: 'center',
  },
  modernSkillScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90E2',
  },
  modernProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modernProgressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  
  // Vendor and Receipt Items Styles
  vendorLocation: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  confidenceText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  receiptItemsSection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  receiptItemsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  receiptItemsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  receiptItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  receiptItemDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  receiptItemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiptItemFeedWeight: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
  },
  receiptItemCategory: {
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  receiptItemPricing: {
    alignItems: 'flex-end',
  },
  receiptItemUnitPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  receiptItemTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  feedAnalysisSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  feedAnalysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  feedAnalysisStats: {
    gap: 6,
  },
  feedAnalysisStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedAnalysisLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  feedAnalysisValue: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
  },
  
  // Enhanced Warnings Styles
  warningGroup: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningGroupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  warningItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  warningItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  warningItemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  warningItemAmount: {
    fontSize: 12,
    color: '#A16207',
  },
  fixItemButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fixItemButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fixAllButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  fixAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  autoPopulateButton: {
    backgroundColor: '#8B5CF6',
    flex: 1,
    marginRight: 8,
  },
  autoPopulateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Manual Input Modal Styles
  itemPreview: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 16,
  },
  itemPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPreviewDescription: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemPreviewAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  categorySelection: {
    marginBottom: 16,
  },
  categorySelectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  categoryOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  weightInput: {
    marginBottom: 16,
  },
  weightInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  weightInputField: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  weightInputHelp: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  bulkFixItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  bulkFixItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulkFixItemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  bulkFixItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  bulkFixField: {
    marginBottom: 8,
  },
  bulkFixFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  bulkFixPicker: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  bulkFixInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonIcon: {
    fontSize: 16,
  },
});

// Helper function for seasonal indicator
const getSeasonFromDate = (date: Date): string => {
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
};

// Helper functions for vendor intelligence extraction
const extractVendorAddress = (ocrText: string): string | undefined => {
  // Look for address patterns in OCR text - handle multi-line addresses
  const addressPatterns = [
    // Single line: "23630 I.H. 10 West, Boerne, TX 78006"
    /(\d+\s+[^,\n]+,\s*[^,\n]+,\s*[A-Z][A-Z]\s+\d{5})/i,
    // Single line: "23630 I.H. 10 West, TX 78006"  
    /(\d+\s+[^,\n]+,\s*[A-Z][A-Z]\s+\d{5})/i,
    // Multi-line: "23630 I.H. 10 West\nBoerne, TX 78006"
    /(\d+\s+[^\n]+)\s*\n([^,\n]+,\s*[A-Z][A-Z]\s+\d{5})/i,
    // Simple: "123 Main St TX 12345"
    /(\d+\s+[^,\n]+\s+[A-Z][A-Z]\s+\d{5})/i,
    // City, State format: "San Antonio, TX"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][A-Z])/i,
    // Store location format: "Store Name\nCity, State"
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][A-Z])$/m
  ];
  
  for (const pattern of addressPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      if (match[2]) {
        // Multi-line address - combine street and city/state/zip
        return `${match[1].trim()}, ${match[2].trim()}`;
      } else {
        // Single line address
        return match[1].trim();
      }
    }
  }
  return undefined;
};

const extractVendorPhone = (ocrText: string): string | undefined => {
  const phonePatterns = [
    /\((\d{3})\)\s*(\d{3})-(\d{4})/,  // "(830) 981-2258"
    /(\d{3})-(\d{3})-(\d{4})/,        // "830-981-2258"
    /(\d{3})\.(\d{3})\.(\d{4})/       // "830.981.2258"
  ];
  
  for (const pattern of phonePatterns) {
    const match = ocrText.match(pattern);
    if (match) return match[0];
  }
  return undefined;
};

const extractVendorWebsite = (ocrText: string): string | undefined => {
  const websitePatterns = [
    /([a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,  // "boerne@struttys.com"
    /(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,            // "www.example.com"
    /([a-zA-Z0-9.-]+\.(com|net|org|edu))/             // "example.com"
  ];
  
  for (const pattern of websitePatterns) {
    const match = ocrText.match(pattern);
    if (match) return match[1];
  }
  return undefined;
};

const extractInvoiceNumber = (ocrText: string): string | undefined => {
  const invoicePatterns = [
    /Invoice[:\s]*(\w+)/i,
    /Receipt[:\s]*(\w+)/i,
    /Trans[:\s]*(\w+)/i
  ];
  
  for (const pattern of invoicePatterns) {
    const match = ocrText.match(pattern);
    if (match) return match[1];
  }
  return undefined;
};

const extractTransactionTime = (ocrText: string): string | undefined => {
  const timePatterns = [
    /Time[:\s]*(\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i,  // "Time: 03:10:13 PM"
    /(\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i,            // "03:10:13 PM"
    /(\d{1,2}:\d{2}\s*[AP]M)/i,                  // "06:42 AM" (fuel receipt format)
    /\d{2}\/\d{2}\/\d{2}\s+(\d{1,2}:\d{2}\s*[AP]M)/i // "12/07/23 06:42 AM"
  ];
  
  for (const pattern of timePatterns) {
    const match = ocrText.match(pattern);
    if (match) return match[1];
  }
  return undefined;
};

const extractTaxAmount = (ocrText: string): number | undefined => {
  const taxPatterns = [
    /Tax[:\s]*\$?(\d+\.?\d*)/i,                    // "Tax: $1.50"
    /Tax\s*\([\d.]+%\)[:\s]*\$?(\d+\.?\d*)/i      // "Tax (8.250%): $1.50"
  ];
  
  for (const pattern of taxPatterns) {
    const match = ocrText.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  return undefined;
};

const extractTaxRate = (ocrText: string): number | undefined => {
  const taxRatePatterns = [
    /Tax\s*\((\d+\.?\d*)%\)/i,      // "Tax (8.250%)"
    /(\d+\.?\d*)%\s*tax/i           // "8.25% tax"
  ];
  
  for (const pattern of taxRatePatterns) {
    const match = ocrText.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  return undefined;
};

const extractEmployeeName = (ocrText: string): string | undefined => {
  const employeePatterns = [
    /Employee[:\s]*(\w+)/i,         // "Employee: TREY"
    /Cashier[:\s]*(\w+)/i,          // "Cashier: TREY"
    /Server[:\s]*(\w+)/i            // "Server: TREY"
  ];
  
  for (const pattern of employeePatterns) {
    const match = ocrText.match(pattern);
    if (match) return match[1];
  }
  return undefined;
};

const extractCashierId = (ocrText: string): string | undefined => {
  const cashierPatterns = [
    /Drawer[:\s]*(\w+)/i,           // "Drawer: 01"
    /Cashier\s*ID[:\s]*(\w+)/i,     // "Cashier ID: 01"
    /Register[:\s]*(\w+)/i          // "Register: 01"
  ];
  
  for (const pattern of cashierPatterns) {
    const match = ocrText.match(pattern);
    if (match) return match[1];
  }
  return undefined;
};