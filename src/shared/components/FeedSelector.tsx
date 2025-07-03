import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { FeedItem } from '../../core/models/Journal';
import { FeedProduct, FEED_DATABASE, FEED_BRANDS, FEED_UNITS, getFeedsByBrand } from '../../core/data/FeedDatabase';
import { FormPicker } from './FormPicker';

interface FeedSelectorProps {
  feeds: FeedItem[];
  onFeedsChange: (feeds: FeedItem[]) => void;
  maxFeeds?: number;
}

export const FeedSelector: React.FC<FeedSelectorProps> = ({
  feeds,
  onFeedsChange,
  maxFeeds = 3
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedItem | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [availableProducts, setAvailableProducts] = useState<FeedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FeedProduct | null>(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [cost, setCost] = useState('');
  const [lastUsedFeeds, setLastUsedFeeds] = useState<FeedItem[]>([]);

  useEffect(() => {
    // Load last used feeds from storage
    loadLastUsedFeeds();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      const products = getFeedsByBrand(selectedBrand);
      setAvailableProducts(products);
      setSelectedProduct(null);
    } else {
      setAvailableProducts([]);
    }
  }, [selectedBrand]);

  const loadLastUsedFeeds = async () => {
    // In a real app, this would load from AsyncStorage
    // For now, we'll simulate with some sample data
    const sampleLastUsed: FeedItem[] = [
      {
        id: 'last_1',
        brand: 'Jacoby',
        product: 'Red Tag Sheep and Goat Developer',
        amount: 1,
        unit: 'lbs',
        cost: 21.75,
        isHay: false,
        category: 'pellets'
      },
      {
        id: 'last_2',
        brand: 'Local',
        product: 'Mixed Hay',
        amount: 1,
        unit: 'flakes',
        isHay: true,
        hayType: 'mixed_grass',
        category: 'hay'
      }
    ];
    setLastUsedFeeds(sampleLastUsed);
  };

  const saveLastUsedFeed = async (feed: FeedItem) => {
    // In a real app, this would save to AsyncStorage
    const updated = [feed, ...lastUsedFeeds.filter(f => f.id !== feed.id)].slice(0, 5);
    setLastUsedFeeds(updated);
  };

  const openAddFeedModal = () => {
    setEditingFeed(null);
    resetModalState();
    setModalVisible(true);
  };

  const openEditFeedModal = (feed: FeedItem) => {
    setEditingFeed(feed);
    
    // Find the product in database
    const product = FEED_DATABASE.find(p => 
      p.brand === feed.brand && p.name === feed.product
    );
    
    setSelectedBrand(feed.brand);
    setSelectedProduct(product || null);
    setAmount(feed.amount.toString());
    setUnit(feed.unit);
    setCost(feed.cost?.toString() || '');
    setModalVisible(true);
  };

  const resetModalState = () => {
    setSelectedBrand('');
    setSelectedProduct(null);
    setAmount('');
    setUnit('lbs');
    setCost('');
  };

  const handleSaveFeed = () => {
    if (!selectedProduct || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please select a product and enter a valid amount.');
      return;
    }

    const feedItem: FeedItem = {
      id: editingFeed?.id || `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brand: selectedProduct.brand,
      product: selectedProduct.name,
      amount: parseFloat(amount),
      unit,
      cost: cost ? parseFloat(cost) : undefined,
      isHay: selectedProduct.isHay,
      hayType: selectedProduct.hayType,
      proteinLevel: selectedProduct.proteinLevel,
      category: selectedProduct.category
    };

    let updatedFeeds;
    if (editingFeed) {
      updatedFeeds = feeds.map(f => f.id === editingFeed.id ? feedItem : f);
    } else {
      updatedFeeds = [...feeds, feedItem];
    }

    onFeedsChange(updatedFeeds);
    saveLastUsedFeed(feedItem);
    setModalVisible(false);
    resetModalState();
  };

  const handleRemoveFeed = (feedId: string) => {
    const updatedFeeds = feeds.filter(f => f.id !== feedId);
    onFeedsChange(updatedFeeds);
  };

  const handleUseLastFeed = (lastFeed: FeedItem) => {
    if (feeds.length >= maxFeeds) {
      Alert.alert('Maximum Feeds', `You can only add up to ${maxFeeds} feeds per entry.`);
      return;
    }

    const newFeed: FeedItem = {
      ...lastFeed,
      id: `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    onFeedsChange([...feeds, newFeed]);
  };

  const brandOptions = FEED_BRANDS.map(brand => ({ label: brand, value: brand }));
  const productOptions = availableProducts.map(product => ({ 
    label: product.name, 
    value: product.id 
  }));

  const totalCost = feeds.reduce((sum, feed) => sum + (feed.cost || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {feeds.length > 0 ? `${feeds.length} feed${feeds.length > 1 ? 's' : ''} selected` : 'No feeds selected'}
        </Text>
        {feeds.length < maxFeeds && (
          <TouchableOpacity style={styles.addButton} onPress={openAddFeedModal}>
            <Text style={styles.addButtonText}>+ Add Feed</Text>
          </TouchableOpacity>
        )}
      </View>

      {feeds.length > 0 && (
        <View style={styles.feedsList}>
          <Text style={styles.sectionTitle}>Selected Feeds ({feeds.length}/{maxFeeds}):</Text>
          {feeds.map((feed) => (
            <View key={feed.id} style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>{feed.brand} {feed.product}</Text>
                <View style={styles.feedActions}>
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => openEditFeedModal(feed)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => handleRemoveFeed(feed.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.feedDetails}>
                {feed.amount} {feed.unit}
                {feed.isHay && feed.hayType ? ` • ${feed.hayType.replace('_', ' ')} hay` : ''}
                {feed.proteinLevel ? ` • ${feed.proteinLevel} protein` : ''}
                {feed.cost ? ` • $${feed.cost.toFixed(2)}` : ''}
              </Text>
            </View>
          ))}
          
          {totalCost > 0 && (
            <View style={styles.totalCostContainer}>
              <Text style={styles.totalCostText}>Total Cost: ${totalCost.toFixed(2)}</Text>
            </View>
          )}
        </View>
      )}

      {lastUsedFeeds.length > 0 && feeds.length < maxFeeds && (
        <View style={styles.lastUsedSection}>
          <Text style={styles.sectionTitle}>Use Last:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {lastUsedFeeds.map((lastFeed, index) => (
              <TouchableOpacity
                key={`last_${index}`}
                style={styles.lastUsedCard}
                onPress={() => handleUseLastFeed(lastFeed)}
              >
                <Text style={styles.lastUsedTitle}>{lastFeed.brand}</Text>
                <Text style={styles.lastUsedProduct}>{lastFeed.product}</Text>
                <Text style={styles.lastUsedDetails}>
                  {lastFeed.amount} {lastFeed.unit}
                  {lastFeed.cost ? ` • $${lastFeed.cost.toFixed(2)}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.helpText}>
        Track feed brands, products, quantities, and costs for detailed analytics
      </Text>

      {/* Add/Edit Feed Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingFeed ? 'Edit Feed' : 'Add Feed'}
            </Text>
            <TouchableOpacity onPress={handleSaveFeed}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <FormPicker
              label="Brand *"
              value={selectedBrand}
              onValueChange={setSelectedBrand}
              options={brandOptions}
              placeholder="Select brand"
            />

            {availableProducts.length > 0 && (
              <FormPicker
                label="Product *"
                value={selectedProduct?.id || ''}
                onValueChange={(value) => {
                  const product = availableProducts.find(p => p.id === value);
                  setSelectedProduct(product || null);
                }}
                options={productOptions}
                placeholder="Select product"
              />
            )}

            {selectedProduct && (
              <View style={styles.productInfo}>
                <Text style={styles.productDescription}>{selectedProduct.description}</Text>
                {selectedProduct.species.length > 0 && (
                  <Text style={styles.productSpecies}>
                    Species: {selectedProduct.species.join(', ')}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={styles.textInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.halfWidth}>
                <FormPicker
                  label="Unit *"
                  value={unit}
                  onValueChange={setUnit}
                  options={FEED_UNITS}
                  placeholder="Select unit"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cost (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={cost}
                onChangeText={setCost}
                placeholder="$0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  feedsList: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  feedCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  feedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  feedDetails: {
    fontSize: 12,
    color: '#666',
  },
  totalCostContainer: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  totalCostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'center',
  },
  lastUsedSection: {
    marginBottom: 16,
  },
  lastUsedCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 140,
  },
  lastUsedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  lastUsedProduct: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  lastUsedDetails: {
    fontSize: 10,
    color: '#999',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  productInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  productSpecies: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});