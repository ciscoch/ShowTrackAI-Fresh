import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
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
  const { addEntry, updateEntry } = useJournalStore();
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
  const [locationLoading, setLocationLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [autofillSuggestions, setAutofillSuggestions] = useState<{title: string, description: string} | null>(null);
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);
  const [isGeneratingAutofill, setIsGeneratingAutofill] = useState(false);
  const [lastFeedOperation, setLastFeedOperation] = useState<number>(0);

  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [currentTrackingDuration, setCurrentTrackingDuration] = useState<number>(0);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(formData.objectives);
  const [detailedAETCategories, setDetailedAETCategories] = useState(aetSkillMatcher.getDetailedAETCategories());
  const [selectedAETCategories, setSelectedAETCategories] = useState<string[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);

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
    const startTime = new Date();
    const trackingEntry = {
      id: entry?.id || `temp_${Date.now()}`,
      activity: formData.title || 'Journal Activity',
      category: formData.category,
      startTime,
    };
    
    startTracking(trackingEntry);
    setIsTracking(true);
    setTrackingStartTime(startTime);
  };

  const handleStopTimeTracking = () => {
    if (activeEntry && trackingStartTime) {
      const duration = Math.floor((Date.now() - trackingStartTime.getTime()) / 60000);
      setFormData(prev => ({ ...prev, duration: prev.duration + duration }));
      stopTracking(activeEntry.id);
      setIsTracking(false);
      setTrackingStartTime(null);
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
    // Track when feed operations happen to prevent unwanted autofill triggers
    setLastFeedOperation(Date.now());
  };
  
  const handleFeedNotesChange = (notes: string) => {
    setFeedData(prev => ({ ...prev, notes }));
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permissionResponse = await Location.getForegroundPermissionsAsync();
      setLocationPermission(permissionResponse);
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions in your device settings to use automatic weather and location features.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
    try {
      setLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });
      return location;
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get current location. Please enter manually.');
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result && result.length > 0) {
        const addr = result[0];
        const parts = [];
        
        // Build a farm-appropriate address
        if (addr.name && !addr.name.match(/^\d+/)) {
          parts.push(addr.name);
        } else if (addr.street) {
          parts.push(addr.street);
        }
        
        if (addr.district || addr.subregion) {
          parts.push(addr.district || addr.subregion);
        } else if (addr.city) {
          parts.push(addr.city);
        }
        
        if (addr.region && addr.region.length === 2) {
          parts.push(addr.region);
        }
        
        let location = parts.join(', ');
        
        // If we don't have a good location, create a generic one
        if (!location || location.length < 5) {
          const cityName = addr.city || 'Rural Area';
          const stateName = addr.region || 'Farm Location';
          location = `${cityName}, ${stateName}`;
        }
        
        return location;
      }
      return 'Current Farm Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Current Farm Location';
    }
  };

  const getWeatherData = async (latitude: number, longitude: number): Promise<string> => {
    try {
      setWeatherLoading(true);
      
      // Simulate API delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // More realistic weather simulation based on location and season
      const now = new Date();
      const month = now.getMonth(); // 0-11
      const hour = now.getHours();
      
      // Temperature based on season and time of day
      let baseTemp = 70;
      if (month >= 11 || month <= 2) baseTemp = 45; // Winter
      else if (month >= 3 && month <= 5) baseTemp = 65; // Spring
      else if (month >= 6 && month <= 8) baseTemp = 85; // Summer
      else baseTemp = 70; // Fall
      
      // Add daily variation
      const timeVariation = Math.sin((hour - 6) * Math.PI / 12) * 15;
      const temperature = Math.round(baseTemp + timeVariation + (Math.random() - 0.5) * 10);
      
      // Weather conditions based on randomness but realistic for farming
      const conditions = [
        'Clear', 'Sunny', 'Partly Cloudy', 'Cloudy', 
        'Overcast', 'Light Breeze', 'Windy'
      ];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      // Humidity based on weather
      let humidity = Math.round(Math.random() * 30 + 40); // 40-70%
      if (condition.includes('Cloud')) humidity += 10;
      humidity = Math.min(humidity, 85);
      
      return `${condition}, ${temperature}°F, ${humidity}% humidity`;
    } catch (error) {
      console.error('Weather error:', error);
      return 'Weather unavailable';
    } finally {
      setWeatherLoading(false);
    }
  };

  const getLocationWeather = async () => {
    if (!useLocationWeather) return;
    
    // Request permission first
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setUseLocationWeather(false);
      return;
    }
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        setUseLocationWeather(false);
        return;
      }
      
      const { latitude, longitude } = location.coords;
      
      // Get location name and weather data in parallel
      const [locationName, weatherData] = await Promise.all([
        reverseGeocode(latitude, longitude),
        getWeatherData(latitude, longitude)
      ]);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        location: locationName,
        weather: weatherData
      }));
      
    } catch (error) {
      console.error('Failed to get location weather:', error);
      Alert.alert('Error', 'Failed to get location and weather data. Please try again or enter manually.');
      setUseLocationWeather(false);
    }
  };

  // Advanced AI Autofill System
  const generateAutofillSuggestions = async () => {
    setIsGeneratingAutofill(true);
    
    try {
      // Analyze all available context for intelligent suggestions
      const context = {
        feeds: feedData.feeds,
        location: formData.location,
        weather: formData.weather,
        date: formData.date,
        aetCategories: selectedAETCategories,
        objectives: selectedObjectives,
        duration: formData.duration,
        timeOfDay: new Date().getHours(),
        season: getCurrentSeason(),
        dayOfWeek: formData.date.getDay()
      };
      
      const suggestions = await generateIntelligentSuggestions(context);
      setAutofillSuggestions(suggestions);
      setShowAutofillPrompt(true);
      
    } catch (error) {
      console.error('Autofill generation error:', error);
      Alert.alert('Autofill Error', 'Unable to generate suggestions. Please enter manually.');
    } finally {
      setIsGeneratingAutofill(false);
    }
  };

  const generateIntelligentSuggestions = async (context: any): Promise<{title: string, description: string}> => {
    // Simulate AI processing delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Analyze feeds for activity type
    const feedTypes = context.feeds.map((f: any) => f.product?.toLowerCase() || '');
    const feedBrands = context.feeds.map((f: any) => f.brand || '');
    const totalCost = feedData.totalCost;
    
    // Analyze AET categories for skill focus
    const categoryNames = context.aetCategories.map((id: string) => 
      detailedAETCategories.find(cat => cat.id === id)?.name || ''
    );
    
    // Time-based context
    const timeContext = getTimeOfDayContext(context.timeOfDay);
    const dateContext = formatDateContext(context.date);
    
    // Weather influence
    const weatherCondition = context.weather.toLowerCase();
    const isGoodWeather = weatherCondition.includes('clear') || weatherCondition.includes('sunny');
    
    // Generate title based on primary activity
    let suggestedTitle = '';
    let suggestedDescription = '';
    
    if (feedTypes.length > 0) {
      // Feed-based activity
      const mainActivity = determineFeedActivity(feedTypes, feedBrands);
      suggestedTitle = `${timeContext.period} ${mainActivity}`;
      
      suggestedDescription = generateFeedDescription({
        feeds: context.feeds,
        location: context.location,
        weather: context.weather,
        timeContext,
        categories: categoryNames,
        cost: totalCost,
        isGoodWeather
      });
    } else if (categoryNames.length > 0) {
      // AET-based activity
      const primaryCategory = categoryNames[0];
      suggestedTitle = `${timeContext.period} ${getPrimaryCategoryActivity(primaryCategory)}`;
      
      suggestedDescription = generateCategoryDescription({
        categories: categoryNames,
        location: context.location,
        weather: context.weather,
        timeContext,
        objectives: context.objectives
      });
    } else {
      // Generic activity based on time and weather
      suggestedTitle = `${timeContext.period} Livestock Management`;
      
      suggestedDescription = generateGenericDescription({
        location: context.location,
        weather: context.weather,
        timeContext,
        isGoodWeather
      });
    }
    
    return {
      title: suggestedTitle,
      description: suggestedDescription
    };
  };

  const getTimeOfDayContext = (hour: number) => {
    if (hour >= 5 && hour < 9) return { period: 'Morning', activity: 'feeding and health checks' };
    if (hour >= 9 && hour < 12) return { period: 'Mid-Morning', activity: 'maintenance and training' };
    if (hour >= 12 && hour < 15) return { period: 'Afternoon', activity: 'monitoring and care' };
    if (hour >= 15 && hour < 18) return { period: 'Late Afternoon', activity: 'feeding and facility checks' };
    if (hour >= 18 && hour < 21) return { period: 'Evening', activity: 'final feeding and securing' };
    return { period: 'Night', activity: 'emergency check and monitoring' };
  };

  const formatDateContext = (date: Date): string => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' } as const;
    return date.toLocaleDateString('en-US', options);
  };

  const determineFeedActivity = (feedTypes: string[], feedBrands: string[]): string => {
    const hasMultipleFeeds = feedTypes.length > 1;
    const hasShowFeed = feedTypes.some(type => type.includes('show') || type.includes('developer'));
    const hasHay = feedTypes.some(type => type.includes('hay') || type.includes('forage'));
    const hasSpecialty = feedTypes.some(type => type.includes('medicated') || type.includes('supplement'));
    
    if (hasShowFeed) return 'Show Animal Feeding & Nutrition Management';
    if (hasSpecialty) return 'Specialized Feed Administration & Health Support';
    if (hasMultipleFeeds) return 'Multi-Feed Nutrition Program Implementation';
    if (hasHay) return 'Forage & Hay Distribution';
    return 'Daily Feeding & Nutrition Management';
  };

  const getPrimaryCategoryActivity = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Feeding & Nutrition': 'Nutritional Management & Feed Distribution',
      'Animal Care & Management': 'Animal Care & Health Monitoring',
      'Health & Veterinary Care': 'Health Assessment & Medical Care',
      'Breeding & Genetics': 'Breeding Program Management',
      'Facilities & Equipment': 'Facility Maintenance & Equipment Check',
      'Record Keeping & Documentation': 'Data Collection & Record Management',
      'Business & Financial Management': 'Financial Planning & Cost Analysis',
      'Safety & Compliance': 'Safety Inspection & Protocol Review'
    };
    return categoryMap[category] || 'Agricultural Education Activity';
  };

  const generateFeedDescription = (params: any): string => {
    const { feeds, location, weather, timeContext, categories, cost, isGoodWeather } = params;
    
    let description = `Conducted ${timeContext.period.toLowerCase()} feeding operations `;
    
    if (location) {
      description += `at ${location}. `;
    } else {
      description += `at the farm facility. `;
    }
    
    // Feed details
    if (feeds.length === 1) {
      const feed = feeds[0];
      description += `Administered ${feed.amount} ${feed.unit} of ${feed.brand} ${feed.product}. `;
    } else if (feeds.length > 1) {
      description += `Implemented multi-feed nutrition program including: `;
      feeds.forEach((feed: any, index: number) => {
        description += `${feed.amount} ${feed.unit} of ${feed.brand} ${feed.product}`;
        if (index < feeds.length - 1) description += ', ';
      });
      description += '. ';
    }
    
    // Cost tracking
    if (cost > 0) {
      description += `Total feed cost: $${cost.toFixed(2)}. `;
    }
    
    // Weather consideration
    if (weather) {
      const weatherLower = weather.toLowerCase();
      if (isGoodWeather) {
        description += `Favorable weather conditions (${weather}) supported normal feeding routines. `;
      } else if (weatherLower.includes('cold') || weatherLower.includes('windy')) {
        description += `Weather conditions (${weather}) required additional attention to animal comfort and feed accessibility. `;
      } else {
        description += `Weather conditions: ${weather}. `;
      }
    }
    
    // Educational focus
    if (categories.length > 0) {
      description += `This activity focused on developing skills in ${categories.join(' and ').toLowerCase()}. `;
    }
    
    description += `Monitored animal behavior and intake levels to ensure optimal nutritional outcomes and animal welfare standards.`;
    
    return description;
  };

  const generateCategoryDescription = (params: any): string => {
    const { categories, location, weather, timeContext, objectives } = params;
    
    let description = `Completed ${timeContext.period.toLowerCase()} agricultural education activities `;
    
    if (location) {
      description += `at ${location} `;
    }
    
    description += `focusing on ${categories.join(', ').toLowerCase()}. `;
    
    if (objectives.length > 0) {
      description += `Learning objectives included: ${objectives.slice(0, 3).join(', ')}. `;
    }
    
    if (weather) {
      description += `Weather conditions (${weather}) were documented as part of environmental factor assessment. `;
    }
    
    description += `Applied agricultural education and training (AET) standards to develop practical skills and knowledge relevant to livestock management and agricultural career pathways.`;
    
    return description;
  };

  const generateGenericDescription = (params: any): string => {
    const { location, weather, timeContext, isGoodWeather } = params;
    
    let description = `Conducted ${timeContext.period.toLowerCase()} livestock management activities `;
    
    if (location) {
      description += `at ${location}. `;
    } else {
      description += `at farm facilities. `;
    }
    
    description += `Performed routine ${timeContext.activity} as part of daily animal husbandry protocols. `;
    
    if (weather) {
      if (isGoodWeather) {
        description += `Excellent weather conditions (${weather}) allowed for comprehensive outdoor activities and thorough facility inspections. `;
      } else {
        description += `Weather conditions (${weather}) were monitored and appropriate adjustments made to ensure animal welfare. `;
      }
    }
    
    description += `Documented observations and maintained detailed records for continuous improvement of farm operations and educational outcomes.`;
    
    return description;
  };

  const applyAutofillSuggestions = () => {
    if (autofillSuggestions) {
      setFormData(prev => ({
        ...prev,
        title: autofillSuggestions.title,
        description: autofillSuggestions.description
      }));
      setShowAutofillPrompt(false);
      setAutofillSuggestions(null);
    }
  };

  const dismissAutofillPrompt = () => {
    setShowAutofillPrompt(false);
    setAutofillSuggestions(null);
  };

  // Trigger autofill when enough context is available
  const checkForAutofillTrigger = () => {
    const hasFeeds = feedData.feeds.length > 0;
    const hasCategories = selectedAETCategories.length > 0;
    const hasContext = formData.location || formData.weather;
    const fieldsEmpty = !formData.title.trim() && !formData.description.trim();
    
    // For Feeding & Nutrition, prefer to have feeds for better autofill context
    const feedingNutritionSelected = selectedAETCategories.includes('feeding_nutrition');
    const hasEnoughContext = feedingNutritionSelected ? (hasFeeds || hasContext) : (hasCategories || hasContext);
    
    if (fieldsEmpty && hasEnoughContext) {
      if (!autofillSuggestions && !isGeneratingAutofill && !showAutofillPrompt) {
        setShowAutofillPrompt(true);
      }
    }
  };

  // Monitor for autofill triggers with delay to prevent unwanted scrolling after feed operations
  useEffect(() => {
    const now = Date.now();
    // Don't trigger autofill immediately after feed operations (within 1 second)
    if (now - lastFeedOperation > 1000) {
      const timeoutId = setTimeout(() => {
        checkForAutofillTrigger();
      }, 300); // Small delay to prevent layout conflicts
      
      return () => clearTimeout(timeoutId);
    }
  }, [feedData.feeds, selectedAETCategories, formData.location, formData.weather, lastFeedOperation]);

  // Update tracking duration every minute when tracking is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isTracking && trackingStartTime) {
      intervalId = setInterval(() => {
        const duration = Math.floor((Date.now() - trackingStartTime.getTime()) / 60000);
        setCurrentTrackingDuration(duration);
      }, 60000); // Update every minute
      
      // Update immediately
      const duration = Math.floor((Date.now() - trackingStartTime.getTime()) / 60000);
      setCurrentTrackingDuration(duration);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTracking, trackingStartTime]);

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

    // Validate feed tracking only when Feeding & Nutrition is selected
    if (selectedAETCategories.includes('feeding_nutrition')) {
      if (!feedData.feeds || feedData.feeds.length === 0) {
        Alert.alert('Feed Tracking Required', 'Please add at least one feed. Feed tracking is required for Feeding & Nutrition activities.');
        return false;
      }
      
      // Validate each feed item has required fields
      for (const feed of feedData.feeds) {
        if (!feed.brand || !feed.product || feed.amount <= 0) {
          Alert.alert('Feed Tracking Error', 'All feeds must have a brand, product, and valid amount.');
          return false;
        }
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
      // Calculate total cost and prepare feed data (include if feeds are present)
      let finalFeedData = null;
      
      if (feedData.feeds.length > 0) {
        const totalCost = feedData.feeds.reduce((sum, feed) => sum + (feed.cost || 0), 0);
        finalFeedData = {
          ...feedData,
          totalCost
        };
      }
      
      const journalData: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        feedData: finalFeedData, // Include feed data only when present
        userId: 'current-user', // Would get from auth context
      };

      if (entry) {
        await updateEntry(entry.id, journalData);
      } else {
        await addEntry(journalData);
      }

      const successMessage = finalFeedData
        ? (() => {
            const feedSummary = finalFeedData.feeds.length === 1 
              ? `${finalFeedData.feeds[0].amount} ${finalFeedData.feeds[0].unit} of ${finalFeedData.feeds[0].product}`
              : `${finalFeedData.feeds.length} different feeds`;
            return `Journal entry ${entry ? 'updated' : 'created'} successfully!\n\nFeed tracked: ${feedSummary}${finalFeedData.totalCost > 0 ? ` ($${finalFeedData.totalCost.toFixed(2)})` : ''}`;
          })()
        : `Journal entry ${entry ? 'updated' : 'created'} successfully!`;
      
      Alert.alert('Success', successMessage, [{ text: 'OK', onPress: onSave }]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeTracker = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⏱️ Time Tracking</Text>
      
      {/* Check In/Out Button */}
      <View style={styles.checkInOutContainer}>
        <TouchableOpacity
          style={[
            styles.checkInOutButton,
            isTracking ? styles.checkOutButton : styles.checkInButton
          ]}
          onPress={isTracking ? handleStopTimeTracking : handleStartTimeTracking}
        >
          <Text style={styles.checkInOutIcon}>
            {isTracking ? '⏹️' : '▶️'}
          </Text>
          <View style={styles.checkInOutTextContainer}>
            <Text style={styles.checkInOutText}>
              {isTracking ? 'Check Out' : 'Check In'}
            </Text>
            {isTracking && (
              <Text style={styles.checkInOutSubtext}>
                Activity in progress...
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        {isTracking && trackingStartTime && (
          <View style={styles.trackingIndicator}>
            <Text style={styles.trackingDuration}>
              Duration: {currentTrackingDuration}m
            </Text>
          </View>
        )}
      </View>

      {/* Manual Duration Input */}
      <View style={styles.manualDurationContainer}>
        <Text style={styles.inputLabel}>Manual Duration (minutes)</Text>
        <TextInput
          style={styles.durationInput}
          value={formData.duration.toString()}
          onChangeText={(text) => setFormData(prev => ({ 
            ...prev, 
            duration: parseInt(text) || 0 
          }))}
          keyboardType="numeric"
          placeholder="Enter duration in minutes"
          editable={!isTracking}
        />
        <Text style={styles.durationHint}>
          {isTracking 
            ? 'Duration will be automatically calculated when you check out'
            : 'Enter the time spent on this activity'
          }
        </Text>
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
      
      // Clear feed data if Feeding & Nutrition is being deselected
      if (categoryId === 'feeding_nutrition') {
        setFeedData({
          feeds: [],
          totalCost: 0,
          notes: ''
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
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 1000
        }}
      >
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

        {/* Feed Tracking - Required for Feeding & Nutrition, Optional for others */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🌾 Feed Data {selectedAETCategories.includes('feeding_nutrition') ? '*' : ''}
            </Text>
            {selectedAETCategories.includes('feeding_nutrition') && (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryText}>Required</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            {selectedAETCategories.includes('feeding_nutrition') 
              ? 'Track all feeds used in this Feeding & Nutrition activity'
              : 'Track feeds used in this activity (optional for this category)'
            }
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

        {/* Basic Information - moved to bottom for better AI autofill UX */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Title *</Text>
              {!formData.title.trim() && !isGeneratingAutofill && (
                <TouchableOpacity 
                  style={styles.autofillButton}
                  onPress={generateAutofillSuggestions}
                  disabled={selectedAETCategories.length === 0 || (selectedAETCategories.includes('feeding_nutrition') && feedData.feeds.length === 0)}
                >
                  <Text style={styles.autofillIcon}>✨</Text>
                  <Text style={styles.autofillButtonText}>AI Autofill</Text>
                </TouchableOpacity>
              )}
              {isGeneratingAutofill && (
                <View style={styles.generatingIndicator}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.generatingText}>Generating...</Text>
                </View>
              )}
            </View>
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
              placeholder="Describe what you did, how you did it, and what you learned..."
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Autofill suggestions */}
          {showAutofillPrompt && autofillSuggestions && (
            <View style={styles.autofillPrompt}>
              <View style={styles.autofillHeader}>
                <Text style={styles.autofillTitle}>✨ AI Suggestions Ready</Text>
                <TouchableOpacity 
                  style={styles.autofillDismissButton}
                  onPress={() => setShowAutofillPrompt(false)}
                >
                  <Text style={styles.autofillDismissText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.autofillPreviewLabel}>Suggested Title:</Text>
              <Text style={styles.autofillPreviewText}>{autofillSuggestions.title}</Text>
              
              <Text style={styles.autofillPreviewLabel}>Suggested Description:</Text>
              <Text style={styles.autofillPreviewText} numberOfLines={3}>
                {autofillSuggestions.description}
              </Text>
              
              <View style={styles.autofillPromptActions}>
                <TouchableOpacity 
                  style={styles.autofillKeepManualButton}
                  onPress={() => setShowAutofillPrompt(false)}
                >
                  <Text style={styles.autofillKeepManualText}>Keep Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.autofillUseButton}
                  onPress={applyAutofillSuggestions}
                >
                  <Text style={styles.autofillUseText}>✨ Use AI Suggestions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Context & Environment */}
          <View style={styles.contextSection}>
            <Text style={styles.contextSectionTitle}>📍 Context & Environment</Text>
            
            <DatePicker
              label="Date"
              value={formData.date}
              onDateChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
              required
            />
            
            <View style={styles.autoDetectContainer}>
              <Text style={styles.autoDetectLabel}>Weather & Location</Text>
              <TouchableOpacity
                style={[
                  styles.autoDetectButton,
                  useLocationWeather && styles.autoDetectButtonActive,
                  (weatherLoading || locationLoading) && styles.autoDetectButtonLoading
                ]}
                onPress={() => {
                  const newValue = !useLocationWeather;
                  setUseLocationWeather(newValue);
                  if (newValue) getLocationWeather();
                }}
                disabled={weatherLoading || locationLoading}
              >
                {(weatherLoading || locationLoading) ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.autoDetectIcon}>📍</Text>
                    <Text style={[
                      styles.autoDetectText,
                      useLocationWeather && styles.autoDetectTextActive
                    ]}>
                      {useLocationWeather ? 'Auto' : 'Manual'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {(weatherLoading || locationLoading) && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>
                  {locationLoading ? 'Getting location...' : 'Fetching weather...'}
                </Text>
              </View>
            )}
            
            <View style={styles.contextInputsContainer}>
              <View style={styles.contextInputWrapper}>
                <Text style={styles.contextInputLabel}>Weather</Text>
                <TextInput
                  style={[
                    styles.contextInput,
                    (weatherLoading || locationLoading) && styles.contextInputDisabled
                  ]}
                  value={formData.weather}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, weather: text }))}
                  placeholder="Clear, 72°F"
                  editable={!useLocationWeather && !weatherLoading && !locationLoading}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.contextInputWrapper}>
                <Text style={styles.contextInputLabel}>Location</Text>
                <TextInput
                  style={[
                    styles.contextInput,
                    (weatherLoading || locationLoading) && styles.contextInputDisabled
                  ]}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                  placeholder="Farm, barn, pasture..."
                  editable={!useLocationWeather && !weatherLoading && !locationLoading}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
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
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  autofillButton: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  autofillIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  autofillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  generatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  generatingText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 6,
    fontStyle: 'italic',
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
  contextSection: {
    marginTop: 20,
  },
  contextSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contextItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contextItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contextIconWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  contextIcon: {
    fontSize: 20,
  },
  contextItemContent: {
    flex: 1,
  },
  contextItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contextLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contextValueButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  contextEditIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  autoDetectButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  autoDetectButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  autoDetectIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  autoDetectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  autoDetectTextActive: {
    color: '#FFFFFF',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  contextInputsContainer: {
    gap: 12,
  },
  contextInputWrapper: {
    
  },
  contextInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  contextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 40,
  },
  contextInputLocation: {
    minHeight: 60,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  contextInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
    opacity: 0.8,
  },
  dateDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  miniCalendar: {
    backgroundColor: '#8B5A3C',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  miniCalendarText: {
    fontSize: 8,
    color: '#FFF',
  },
  miniCalendarDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: -2,
  },
  checkInOutContainer: {
    marginBottom: 16,
  },
  checkInOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
  },
  checkOutButton: {
    backgroundColor: '#f44336',
  },
  checkInOutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  checkInOutTextContainer: {
    alignItems: 'center',
  },
  checkInOutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  checkInOutSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  trackingIndicator: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  trackingDuration: {
    fontSize: 16,
    fontWeight: '500',
    color: '#856404',
  },
  manualDurationContainer: {
    marginTop: 16,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  durationHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  // Autofill Prompt Styles
  autofillPrompt: {
    backgroundColor: '#F8FDFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#B3E5FC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autofillHeader: {
    marginBottom: 16,
  },
  autofillTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  autofillSubtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  autofillPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewItem: {
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  autofillActions: {
    flexDirection: 'row',
    gap: 12,
  },
  autofillActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  autofillActionButtonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  autofillActionTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  autofillActionTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});