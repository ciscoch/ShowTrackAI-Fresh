import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Journal, FeedTrackingData, FeedItem } from '../../../core/models/Journal';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { useTimeTrackingStore } from '../../../core/stores/TimeTrackingStore';
import { aetSkillMatcher } from '../../../core/services/AETSkillMatcher';
import type { AIActivitySuggestion } from '../../../core/services/AETSkillMatcher';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';
import { TimeTracker } from '../../../shared/components/TimeTracker';
import { FeedSelector } from '../../../shared/components/FeedSelector';

interface JournalEntryScreenProps {
  entry?: Journal;
  onSave: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export const JournalEntryScreen: React.FC<JournalEntryScreenProps> = ({
  entry,
  onSave,
  onCancel,
  onBack,
}) => {
  const { createEntry, updateEntry } = useJournalStore();
  const { activeEntry, startTracking, stopTracking } = useTimeTrackingStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    description: entry?.description || '',
    category: entry?.category || 'Animal Care & Management',
    date: entry?.date || new Date(),
    duration: entry?.duration || 0,
    aetSkills: entry?.aetSkills || [],
    notes: entry?.notes || '',
    weather: entry?.weather?.conditions || '',
    location: entry?.location?.address || '',
    objectives: entry?.objectives || [],
    learningOutcomes: entry?.learningOutcomes || [],
    challenges: entry?.challenges || '',
    improvements: entry?.improvements || '',
  });

  // Enhanced state for new features - Initialize from entry if editing
  const [feedData, setFeedData] = useState<FeedTrackingData>(entry?.feedData || {
    feeds: [],
    totalCost: 0,
    notes: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState<AIActivitySuggestion | null>(null);
  const [useLocationWeather, setUseLocationWeather] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(formData.objectives);
  const [detailedAETCategories, setDetailedAETCategories] = useState(aetSkillMatcher.getDetailedAETCategories());
  const [selectedAETCategories, setSelectedAETCategories] = useState<string[]>([]);

  const categories = [
    { label: 'Feeding & Nutrition', value: 'Feeding & Nutrition' },
    { label: 'Animal Care & Management', value: 'Animal Care & Management' },
    { label: 'Health & Veterinary Care', value: 'Health & Veterinary Care' },
    { label: 'Breeding & Genetics', value: 'Breeding & Genetics' },
    { label: 'Facilities & Equipment', value: 'Facilities & Equipment' },
    { label: 'Record Keeping & Documentation', value: 'Record Keeping & Documentation' },
    { label: 'Business & Financial Management', value: 'Business & Financial Management' },
    { label: 'Safety & Compliance', value: 'Safety & Compliance' },
    { label: 'Training & Exercise', value: 'Training & Exercise' },
    { label: 'Grooming & Maintenance', value: 'Grooming & Maintenance' },
    { label: 'Competition Preparation', value: 'Competition Preparation' },
    { label: 'Educational Activities', value: 'Educational Activities' },
  ];

  const feedUnits = [
    { label: 'Pounds (lbs)', value: 'lbs' },
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Bales', value: 'bales' },
    { label: 'Flakes', value: 'flakes' },
    { label: 'Scoops', value: 'scoops' },
  ];

  // These are now handled by the FeedSelector component and FeedDatabase

  const learningObjectives = [
    'Animal Husbandry & Care',
    'Nutritional Management',
    'Health Assessment & Treatment',
    'Breeding & Reproduction',
    'Record Keeping & Documentation',
    'Business & Financial Planning',
    'Equipment Operation & Maintenance',
    'Safety & Biosecurity',
    'Quality Assurance & Standards',
    'Problem Solving & Decision Making',
    'Communication & Leadership',
    'Technology & Innovation',
    'Sustainability & Environment',
    'Market Analysis & Marketing',
    'Project Management',
    'Critical Thinking & Analysis',
  ];

  useEffect(() => {
    // Check if we're currently tracking time for this entry
    if (activeEntry && entry?.id === activeEntry.id) {
      setIsTracking(true);
      const duration = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 60000);
      setFormData(prev => ({ ...prev, duration }));
    }
  }, [activeEntry, entry?.id]);

  useEffect(() => {
    // Get AI suggestions when enough context is available
    if (formData.category === 'Feeding & Nutrition' || feedData.feeds.length > 0 || formData.description.length > 20) {
      generateAISuggestions();
    }
  }, [formData.category, formData.description, feedData.feeds]);

  const generateAISuggestions = () => {
    const context = {
      currentSeason: getCurrentSeason(),
      animalTypes: ['cattle', 'sheep'], // Would come from user's animals
      feedData: feedData.feeds.length > 0 ? feedData : undefined,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
      weatherConditions: useLocationWeather ? 'auto-detected' : 'clear',
      location: formData.location || 'barn'
    };

    const suggestions = aetSkillMatcher.generateAIActivitySuggestion(context);
    setAiSuggestions(suggestions);
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const applyAISuggestions = () => {
    if (aiSuggestions) {
      setFormData(prev => ({
        ...prev,
        title: aiSuggestions.suggestedTitle,
        description: aiSuggestions.suggestedDescription,
        aetSkills: [...prev.aetSkills, ...aiSuggestions.suggestedAETSkills],
        objectives: [...prev.objectives, ...aiSuggestions.suggestedObjectives]
      }));
      setSelectedObjectives(prev => [...prev, ...aiSuggestions.suggestedObjectives]);
    }
  };

  const handleStartTimeTracking = () => {
    const trackingEntry = {
      id: entry?.id || `temp_${Date.now()}`,
      activity: formData.title || 'Journal Activity',
      category: formData.category,
      startTime: new Date(),
    };
    
    startTracking(trackingEntry);
    setIsTracking(true);
  };

  const handleStopTimeTracking = () => {
    if (activeEntry) {
      const duration = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 60000);
      setFormData(prev => ({ ...prev, duration: prev.duration + duration }));
      stopTracking(activeEntry.id);
      setIsTracking(false);
    }
  };

  const handleAddSkill = (skillId: string) => {
    if (!formData.aetSkills.includes(skillId)) {
      setFormData(prev => ({
        ...prev,
        aetSkills: [...prev.aetSkills, skillId]
      }));
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      aetSkills: prev.aetSkills.filter(id => id !== skillId)
    }));
  };

  const handleObjectiveToggle = (objective: string) => {
    const updatedObjectives = selectedObjectives.includes(objective)
      ? selectedObjectives.filter(o => o !== objective)
      : [...selectedObjectives, objective];
    
    setSelectedObjectives(updatedObjectives);
    setFormData(prev => ({ ...prev, objectives: updatedObjectives }));
  };

  const handleFeedsChange = (feeds: FeedItem[]) => {
    setFeedData(prev => ({ ...prev, feeds }));
  };
  
  const handleFeedNotesChange = (notes: string) => {
    setFeedData(prev => ({ ...prev, notes }));
  };

  const getLocationWeather = async () => {
    if (!useLocationWeather) return;
    
    try {
      // Simulate geolocation and weather API call
      const weather = `Clear, 72°F at ${formData.location || 'Current Location'}`;
      setFormData(prev => ({ ...prev, weather }));
    } catch (error) {
      console.error('Failed to get location weather:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your journal entry.');
      return false;
    }
    
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description of your activity.');
      return false;
    }
    
    if (formData.duration <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid duration or use time tracking.');
      return false;
    }

    // Validate mandatory feed tracking
    if (!feedData.feeds || feedData.feeds.length === 0) {
      Alert.alert('Feed Tracking Required', 'Please add at least one feed. Feed tracking is required for all journal entries.');
      return false;
    }
    
    // Validate each feed item has required fields
    for (const feed of feedData.feeds) {
      if (!feed.brand || !feed.product || feed.amount <= 0) {
        Alert.alert('Feed Tracking Error', 'All feeds must have a brand, product, and valid amount.');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Stop time tracking if active
    if (isTracking && activeEntry) {
      handleStopTimeTracking();
    }

    setLoading(true);
    try {
      // Calculate total cost
      const totalCost = feedData.feeds.reduce((sum, feed) => sum + (feed.cost || 0), 0);
      const finalFeedData = {
        ...feedData,
        totalCost
      };
      
      const journalData: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        feedData: finalFeedData, // Include mandatory feed tracking data
        userId: 'current-user', // Would get from auth context
      };

      if (entry) {
        await updateEntry(entry.id, journalData);
      } else {
        await createEntry(journalData);
      }

      const feedSummary = finalFeedData.feeds.length === 1 
        ? `${finalFeedData.feeds[0].amount} ${finalFeedData.feeds[0].unit} of ${finalFeedData.feeds[0].product}`
        : `${finalFeedData.feeds.length} different feeds`;
      
      Alert.alert(
        'Success',
        `Journal entry ${entry ? 'updated' : 'created'} successfully!\n\nFeed tracked: ${feedSummary}${finalFeedData.totalCost > 0 ? ` ($${finalFeedData.totalCost.toFixed(2)})` : ''}`,
        [{ text: 'OK', onPress: onSave }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeTracker = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⏱️ Time Tracking</Text>
      
      <View style={styles.timeTrackerContainer}>
        <TimeTracker
          isActive={isTracking}
          currentDuration={formData.duration}
          onStart={handleStartTimeTracking}
          onStop={handleStopTimeTracking}
          activity={formData.title || 'Current Activity'}
        />
      </View>

      <View style={styles.durationInput}>
        <Text style={styles.inputLabel}>Manual Duration (minutes)</Text>
        <TextInput
          style={styles.smallInput}
          value={formData.duration.toString()}
          onChangeText={(text) => setFormData(prev => ({ 
            ...prev, 
            duration: parseInt(text) || 0 
          }))}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>
    </View>
  );

  // AET Category to Learning Objectives mapping
  const getMatchingObjectives = (categoryId: string): string[] => {
    const objectiveMap: Record<string, string[]> = {
      'feeding_nutrition': [
        'Nutritional Management',
        'Animal Husbandry & Care',
        'Record Keeping & Documentation',
        'Quality Assurance & Standards'
      ],
      'animal_care': [
        'Animal Husbandry & Care',
        'Health Assessment & Treatment',
        'Safety & Biosecurity',
        'Problem Solving & Decision Making'
      ],
      'breeding_genetics': [
        'Breeding & Reproduction',
        'Record Keeping & Documentation',
        'Quality Assurance & Standards',
        'Technology & Innovation'
      ],
      'health_veterinary': [
        'Health Assessment & Treatment',
        'Safety & Biosecurity',
        'Problem Solving & Decision Making',
        'Quality Assurance & Standards'
      ],
      'facilities_equipment': [
        'Equipment Operation & Maintenance',
        'Safety & Biosecurity',
        'Problem Solving & Decision Making',
        'Technology & Innovation'
      ],
      'record_keeping': [
        'Record Keeping & Documentation',
        'Technology & Innovation',
        'Business & Financial Planning',
        'Quality Assurance & Standards'
      ],
      'business_management': [
        'Business & Financial Planning',
        'Record Keeping & Documentation',
        'Communication & Leadership',
        'Market Analysis & Marketing'
      ],
      'safety_compliance': [
        'Safety & Biosecurity',
        'Quality Assurance & Standards',
        'Equipment Operation & Maintenance',
        'Communication & Leadership'
      ]
    };
    
    return objectiveMap[categoryId] || [];
  };

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedAETCategories.includes(categoryId);
    
    if (isSelected) {
      // Remove category and its skills
      setSelectedAETCategories(prev => prev.filter(id => id !== categoryId));
      const category = detailedAETCategories.find(cat => cat.id === categoryId);
      if (category) {
        category.skills.forEach(skillId => {
          handleRemoveSkill(skillId);
        });
      }
      
      // Remove matching learning objectives
      const matchingObjectives = getMatchingObjectives(categoryId);
      setSelectedObjectives(prev => {
        const updated = prev.filter(obj => !matchingObjectives.includes(obj));
        setFormData(prevForm => ({ ...prevForm, objectives: updated }));
        return updated;
      });
    } else {
      // Add category and its skills
      setSelectedAETCategories(prev => [...prev, categoryId]);
      const category = detailedAETCategories.find(cat => cat.id === categoryId);
      if (category) {
        category.skills.forEach(skillId => {
          if (!formData.aetSkills.includes(skillId)) {
            handleAddSkill(skillId);
          }
        });
      }
      
      // Add matching learning objectives
      const matchingObjectives = getMatchingObjectives(categoryId);
      setSelectedObjectives(prev => {
        const newObjectives = [...prev];
        matchingObjectives.forEach(obj => {
          if (!newObjectives.includes(obj)) {
            newObjectives.push(obj);
          }
        });
        setFormData(prevForm => ({ ...prevForm, objectives: newObjectives }));
        return newObjectives;
      });
    }
  };

  const renderAETSkills = () => {
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 AET Skills Development</Text>
        <Text style={styles.sectionSubtitle}>
          Agricultural Education & Training skills that align with career pathways
        </Text>
        
        <Text style={styles.subsectionTitle}>AET Categories & Skills:</Text>
        
        {detailedAETCategories.map((category) => {
          const isSelected = selectedAETCategories.includes(category.id);
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.aetCategoryCard,
                { borderLeftColor: category.color },
                isSelected && styles.aetCategoryCardSelected
              ]}
              onPress={() => handleCategoryToggle(category.id)}
            >
              <View style={styles.aetCategoryHeader}>
                <Text style={styles.aetCategoryIcon}>{category.icon}</Text>
                <View style={styles.aetCategoryInfo}>
                  <Text style={styles.aetCategoryName}>{category.name}</Text>
                  <Text style={styles.aetCategoryDifficulty}>
                    {category.difficultyLevel} Level
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.aetCategoryDescription}>
                {category.description}
              </Text>
              
              <View style={styles.aetCategoryFooter}>
                <Text style={styles.aetCategoryPathways}>
                  💼 {category.careerPathways.slice(0, 2).join(', ')}
                  {category.careerPathways.length > 2 && ` +${category.careerPathways.length - 2} more`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {selectedAETCategories.length > 0 && (
          <View style={styles.selectedSkillsSummary}>
            <Text style={styles.selectedSkillsSummaryText}>
              🎓 {selectedAETCategories.length} AET categor{selectedAETCategories.length === 1 ? 'y' : 'ies'} selected ({formData.aetSkills.length} skills)
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Check if objective was auto-selected from AET categories
  const isAutoSelected = (objective: string): boolean => {
    return selectedAETCategories.some(categoryId => 
      getMatchingObjectives(categoryId).includes(objective)
    );
  };

  const renderLearningObjectives = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Learning Objectives</Text>
      <Text style={styles.sectionSubtitle}>
        Objectives automatically selected from your AET skills, or add additional ones
      </Text>
      
      {selectedObjectives.length > 0 && (
        <View style={styles.autoSelectedInfo}>
          <Text style={styles.autoSelectedText}>
            ✨ {selectedObjectives.filter(isAutoSelected).length} auto-selected from AET categories
          </Text>
        </View>
      )}
      
      <View style={styles.objectivesGrid}>
        {learningObjectives.map((objective) => {
          const isSelected = selectedObjectives.includes(objective);
          const isAuto = isAutoSelected(objective);
          
          return (
            <TouchableOpacity
              key={objective}
              style={[
                styles.objectiveChip,
                isSelected && styles.objectiveChipSelected,
                isAuto && styles.objectiveChipAuto
              ]}
              onPress={() => handleObjectiveToggle(objective)}
            >
              <Text style={[
                styles.objectiveChipText,
                isSelected && styles.objectiveChipTextSelected
              ]}>
                {objective}
              </Text>
              {isSelected && (
                <Text style={[
                  styles.checkmark,
                  isAuto && styles.checkmarkAuto
                ]}>
                  {isAuto ? '⚡' : '✓'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {selectedObjectives.length > 0 && (
        <View style={styles.objectivesSummary}>
          <Text style={styles.objectivesSummaryText}>
            📊 {selectedObjectives.length} objective{selectedObjectives.length === 1 ? '' : 's'} selected
            {selectedObjectives.filter(isAutoSelected).length > 0 && 
              ` (${selectedObjectives.filter(isAutoSelected).length} auto-matched)`
            }
          </Text>
        </View>
      )}
    </View>
  );

  const renderReflectionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💭 Reflection</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Challenges Faced</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.challenges}
          onChangeText={(text) => setFormData(prev => ({ ...prev, challenges: text }))}
          placeholder="What challenges did you encounter?"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Areas for Improvement</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.improvements}
          onChangeText={(text) => setFormData(prev => ({ ...prev, improvements: text }))}
          placeholder="What could you do better next time?"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {entry ? 'Edit Entry' : 'New Journal Entry'}
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="What activity did you do?"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe what you did in detail..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.contextRow}>
            <View style={styles.contextField}>
              <Text style={styles.contextLabel}>📅 Date</Text>
              <TouchableOpacity style={styles.contextButton}>
                <DatePicker
                  value={formData.date}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                  placeholder="Select date"
                  renderButton={({ onPress }) => (
                    <TouchableOpacity style={styles.dateButton} onPress={onPress}>
                      <Text style={styles.dateText}>
                        {formData.date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.contextField}>
              <View style={styles.contextLabelRow}>
                <Text style={styles.contextLabel}>🌤️ Weather</Text>
                <Switch
                  value={useLocationWeather}
                  onValueChange={(value) => {
                    setUseLocationWeather(value);
                    if (value) getLocationWeather();
                  }}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                  style={styles.miniSwitch}
                />
              </View>
              <TextInput
                style={styles.contextInput}
                value={formData.weather}
                onChangeText={(text) => setFormData(prev => ({ ...prev, weather: text }))}
                placeholder={useLocationWeather ? "Auto..." : "75°F Sunny"}
                editable={!useLocationWeather}
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.contextField}>
              <Text style={styles.contextLabel}>📍 Location</Text>
              <TextInput
                style={styles.contextInput}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Barn A"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* AI Suggestions */}
        {aiSuggestions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI Suggestions</Text>
            <Text style={styles.sectionSubtitle}>
              Based on your activity context (Confidence: {Math.round(aiSuggestions.confidenceScore * 100)}%)
            </Text>
            
            <View style={styles.aiSuggestionCard}>
              <Text style={styles.aiSuggestionTitle}>Suggested Title:</Text>
              <Text style={styles.aiSuggestionText}>{aiSuggestions.suggestedTitle}</Text>
              
              <Text style={styles.aiSuggestionTitle}>Suggested Description:</Text>
              <Text style={styles.aiSuggestionText}>{aiSuggestions.suggestedDescription}</Text>
              
              <Text style={styles.aiSuggestionReasoning}>💡 {aiSuggestions.reasoning}</Text>
              
              <TouchableOpacity style={styles.applyButton} onPress={applyAISuggestions}>
                <Text style={styles.applyButtonText}>✨ Apply Suggestions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {renderAETSkills()}

        {/* Feed Tracking - Mandatory */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌾 Feed Data *</Text>
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryText}>Required</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Track all feeds used in this activity for comprehensive record keeping
          </Text>
          
          <FeedSelector
            feeds={feedData.feeds}
            onFeedsChange={handleFeedsChange}
            maxFeeds={3}
          />
          
          {feedData.feeds.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Feed Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={feedData.notes}
                onChangeText={handleFeedNotesChange}
                placeholder="Notes about feeding, animal response, quality observations..."
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        </View>
        {renderTimeTracker()}
        {renderLearningObjectives()}
        {renderReflectionSection()}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Additional Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Any additional observations or notes..."
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : entry ? 'Update Entry' : 'Save Entry'}
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
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    width: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  oneThirdWidth: {
    flex: 1,
    marginHorizontal: 2,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  contextField: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  contextLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contextButton: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  contextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  miniSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  timeTrackerContainer: {
    marginBottom: 16,
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestedSkills: {
    marginBottom: 16,
  },
  selectedSkills: {
    marginBottom: 8,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skillChipSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  skillChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  skillChipTextSelected: {
    color: '#007AFF',
  },
  selectedSkillChip: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  selectedSkillChipText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  objectivesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  objectiveChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  objectiveChipSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  objectiveChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  objectiveChipTextSelected: {
    color: '#007AFF',
  },
  objectiveChipAuto: {
    backgroundColor: '#E8F5E8',
    borderColor: '#34C759',
    borderWidth: 2,
  },
  checkmark: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  checkmarkAuto: {
    color: '#34C759',
  },
  autoSelectedInfo: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  autoSelectedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  objectivesSummary: {
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  objectivesSummaryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for enhanced features
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  locationWeatherSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedTrackingContainer: {
    marginTop: 12,
  },
  haySection: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  aiSuggestionCard: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  aiSuggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  aiSuggestionText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    lineHeight: 18,
  },
  aiSuggestionReasoning: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  aetCategoriesContainer: {
    marginVertical: 8,
  },
  aetCategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  aetCategoryCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  aetCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aetCategoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  aetCategoryInfo: {
    flex: 1,
  },
  aetCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  aetCategoryDifficulty: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  aetCategoryDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  aetCategoryFooter: {
    marginTop: 4,
  },
  aetCategoryPathways: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  selectedBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedSkillsSummary: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  selectedSkillsSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  mandatoryBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mandatoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: 8,
  },
});