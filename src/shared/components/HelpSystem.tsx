import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { helpContentService, HelpContent } from '../services/HelpContentService';

interface HelpSystemProps {
  visible: boolean;
  onClose: () => void;
  initialScreen?: string;
  userType?: 'student' | 'educator' | 'admin';
  initialCategory?: string;
  initialContentId?: string;
}

export const HelpSystem: React.FC<HelpSystemProps> = ({
  visible,
  onClose,
  initialScreen,
  userType = 'student',
  initialCategory,
  initialContentId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchResults, setSearchResults] = useState<HelpContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);
  const [relatedContent, setRelatedContent] = useState<HelpContent[]>([]);
  const [contextualHelp, setContextualHelp] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'browse' | 'contextual'>('contextual');

  const categories = [
    { id: 'all', name: 'All', icon: '📚' },
    { id: 'student_guide', name: 'Student Guide', icon: '🎓' },
    { id: 'educator_guide', name: 'Educator Guide', icon: '👩‍🏫' },
    { id: 'disease_reference', name: 'Disease Reference', icon: '🔬' },
    { id: 'quick_reference', name: 'Quick Reference', icon: '⚡' },
    { id: 'technical_guide', name: 'Technical', icon: '⚙️' },
  ];

  useEffect(() => {
    if (visible) {
      initializeHelp();
    }
  }, [visible, initialScreen, initialContentId]);

  const initializeHelp = async () => {
    setIsLoading(true);
    try {
      await helpContentService.initialize();

      // Load initial content if specified
      if (initialContentId) {
        const content = await helpContentService.getContentById(initialContentId);
        if (content) {
          setSelectedContent(content);
          setActiveTab('browse');
          const related = await helpContentService.getRelatedContent(initialContentId);
          setRelatedContent(related);
        }
      }

      // Load contextual help if screen is specified
      if (initialScreen) {
        const contextual = await helpContentService.getContextualHelp(initialScreen, userType);
        if (contextual) {
          setContextualHelp(contextual.helpItems);
          setActiveTab('contextual');
        }
      }

      // Load popular content by default
      if (!initialContentId && !initialScreen) {
        const popular = await helpContentService.getPopularContent();
        setSearchResults(popular);
        setActiveTab('browse');
      }
    } catch (error) {
      console.error('Failed to initialize help system:', error);
      Alert.alert('Error', 'Failed to load help content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      const popular = await helpContentService.getPopularContent();
      setSearchResults(popular);
      return;
    }

    setIsLoading(true);
    try {
      const results = await helpContentService.searchContent(
        query,
        selectedCategory === 'all' ? undefined : selectedCategory,
        userType === 'student' ? 'high' : 'adult'
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsLoading(true);
    try {
      const results = categoryId === 'all' 
        ? await helpContentService.getPopularContent()
        : await helpContentService.getContentByCategory(categoryId);
      setSearchResults(results);
    } catch (error) {
      console.error('Category filter failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSelect = async (content: HelpContent) => {
    setSelectedContent(content);
    const related = await helpContentService.getRelatedContent(content.id);
    setRelatedContent(related);
  };

  const handleContextualHelpSelect = async (helpItem: any) => {
    if (helpItem.contentId) {
      const content = await helpContentService.getContentById(helpItem.contentId);
      if (content) {
        handleContentSelect(content);
      }
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'contextual', name: 'For This Screen', icon: '🎯' },
        { id: 'search', name: 'Search', icon: '🔍' },
        { id: 'browse', name: 'Browse', icon: '📖' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTabIcon]}>
            {tab.icon}
          </Text>
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search help content..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryPill,
              selectedCategory === category.id && styles.selectedCategoryPill,
            ]}
            onPress={() => handleCategoryChange(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.resultItem}
              onPress={() => handleContentSelect(item)}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultCategory}>{item.category.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.resultPreview} numberOfLines={2}>
                {item.content.replace(/[#*•□]/g, '').substring(0, 100)}...
              </Text>
            </TouchableOpacity>
          ))}
          {searchResults.length === 0 && !isLoading && (
            <Text style={styles.noResults}>
              {searchQuery ? 'No results found. Try different keywords.' : 'No content available.'}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderContextualTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Help for Current Screen</Text>
      {contextualHelp.length > 0 ? (
        <ScrollView>
          {contextualHelp.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contextualItem}
              onPress={() => handleContextualHelpSelect(item)}
            >
              <Text style={styles.contextualTitle}>{item.title}</Text>
              <Text style={styles.contextualDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noContextualHelp}>
          <Text style={styles.noContextualText}>
            No specific help available for this screen.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setActiveTab('search')}
          >
            <Text style={styles.browseButtonText}>Browse All Help Topics</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderContentView = () => (
    <View style={styles.contentView}>
      <View style={styles.contentHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedContent(null)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.contentTitleContainer}>
          <Text style={styles.contentTitle}>{selectedContent?.title}</Text>
          <Text style={styles.contentCategory}>
            {selectedContent?.category.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.contentScroll}>
        <Text style={styles.contentText}>
          {selectedContent?.content}
        </Text>

        {relatedContent.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Topics</Text>
            {relatedContent.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.relatedItem}
                onPress={() => handleContentSelect(item)}
              >
                <Text style={styles.relatedItemTitle}>{item.title}</Text>
                <Text style={styles.relatedItemCategory}>
                  {item.category.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderBrowseTab = () => {
    if (selectedContent) {
      return renderContentView();
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Popular Help Topics</Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.browseItem}
                onPress={() => handleContentSelect(item)}
              >
                <Text style={styles.browseItemTitle}>{item.title}</Text>
                <Text style={styles.browseItemCategory}>
                  {item.category.replace('_', ' ')}
                </Text>
                <Text style={styles.browseItemPreview} numberOfLines={2}>
                  {item.content.replace(/[#*•□]/g, '').substring(0, 80)}...
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📚 Help & Support</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {renderTabBar()}

          {activeTab === 'search' && renderSearchTab()}
          {activeTab === 'contextual' && renderContextualTab()}
          {activeTab === 'browse' && renderBrowseTab()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#fff',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedCategoryPill: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resultCategory: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  resultPreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contextualItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contextualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contextualDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noContextualHelp: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  noContextualText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  browseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  browseItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  browseItemCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  browseItemPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contentView: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  contentTitleContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  contentCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  relatedSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  relatedItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  relatedItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  relatedItemCategory: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 2,
  },
});