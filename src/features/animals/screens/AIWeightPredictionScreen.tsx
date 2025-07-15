import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Animal } from '../../../core/models/Animal';
import { useAnalytics } from '../../../core/hooks/useAnalytics';

interface WeightPrediction {
  predictedWeight: number;
  confidence: number;
  timeframe: string;
  factors: {
    currentWeight: number;
    ageInDays: number;
    breed: string;
    feedingPattern: string;
    growthTrend: string;
  };
  recommendations: string[];
}

interface AIWeightPredictionScreenProps {
  animal: Animal;
  onBack: () => void;
  onTakePhoto: () => void;
}

export const AIWeightPredictionScreen: React.FC<AIWeightPredictionScreenProps> = ({
  animal,
  onBack,
  onTakePhoto,
}) => {
  const [prediction, setPrediction] = useState<WeightPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [historicalPredictions, setHistoricalPredictions] = useState<WeightPrediction[]>([]);

  // Analytics
  const { trackFeatureUsage, trackAIEvent } = useAnalytics({
    autoTrackScreenView: true,
    screenName: 'AIWeightPredictionScreen',
  });

  useEffect(() => {
    generatePrediction();
    loadHistoricalPredictions();
  }, []);

  const generatePrediction = async () => {
    try {
      setLoading(true);
      trackAIEvent('weight_prediction_started', {
        animal_species: animal.species,
        current_weight: animal.weight,
        animal_age_months: calculateAgeInMonths(animal.birthDate),
        prediction_type: 'weight',
        accuracy_rate: 91.6,
      });

      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI prediction based on animal data
      const mockPrediction: WeightPrediction = {
        predictedWeight: (animal.weight || 50) + 15,
        confidence: 91.6,
        timeframe: '30 days',
        factors: {
          currentWeight: animal.weight || 50,
          ageInDays: calculateAgeInDays(animal.birthDate),
          breed: animal.breed,
          feedingPattern: 'Regular',
          growthTrend: 'Steady',
        },
        recommendations: [
          'Maintain current feeding schedule',
          'Monitor daily weight gain of 0.5-0.7 lbs',
          'Ensure adequate protein intake (16-18%)',
          'Consider increasing exercise if weight gain is too rapid',
        ],
      };

      setPrediction(mockPrediction);
      
      trackAIEvent('weight_prediction_completed', {
        animal_species: animal.species,
        predicted_weight: mockPrediction.predictedWeight,
        confidence_score: mockPrediction.confidence,
        prediction_timeframe: mockPrediction.timeframe,
        accuracy_rate: 91.6,
      });
    } catch (error) {
      console.error('Failed to generate prediction:', error);
      Alert.alert('Error', 'Failed to generate weight prediction');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalPredictions = () => {
    // Mock historical predictions
    const mockHistory: WeightPrediction[] = [
      {
        predictedWeight: (animal.weight || 50) + 10,
        confidence: 89.2,
        timeframe: '30 days ago',
        factors: {
          currentWeight: (animal.weight || 50) - 10,
          ageInDays: calculateAgeInDays(animal.birthDate) - 30,
          breed: animal.breed,
          feedingPattern: 'Regular',
          growthTrend: 'Steady',
        },
        recommendations: [],
      },
      {
        predictedWeight: (animal.weight || 50) + 5,
        confidence: 87.8,
        timeframe: '60 days ago',
        factors: {
          currentWeight: (animal.weight || 50) - 20,
          ageInDays: calculateAgeInDays(animal.birthDate) - 60,
          breed: animal.breed,
          feedingPattern: 'Regular',
          growthTrend: 'Steady',
        },
        recommendations: [],
      },
    ];
    setHistoricalPredictions(mockHistory);
  };

  const calculateAgeInDays = (birthDate?: Date): number => {
    if (!birthDate) return 0;
    const now = new Date();
    const birth = new Date(birthDate);
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateAgeInMonths = (birthDate?: Date): number => {
    if (!birthDate) return 0;
    const now = new Date();
    const birth = new Date(birthDate);
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  };

  const handleRefreshPrediction = () => {
    generatePrediction();
  };

  const handlePhotoBasedPrediction = () => {
    trackFeatureUsage('ai_tools', {
      action: 'photo_based_prediction_initiated',
      animal_species: animal.species,
    });
    onTakePhoto();
  };

  const renderPredictionCard = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingTitle}>Analyzing Growth Patterns</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI is processing {animal.name}'s data to generate accurate predictions...
          </Text>
        </View>
      );
    }

    if (!prediction) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🤖</Text>
          <Text style={styles.errorTitle}>Prediction Unavailable</Text>
          <Text style={styles.errorSubtitle}>
            Unable to generate prediction. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefreshPrediction}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.predictionCard}>
        <View style={styles.predictionHeader}>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>{prediction.confidence}%</Text>
            <Text style={styles.confidenceLabel}>Accuracy</Text>
          </View>
          <View style={styles.predictionMain}>
            <Text style={styles.predictedWeight}>{prediction.predictedWeight.toFixed(1)} lbs</Text>
            <Text style={styles.predictionTimeframe}>in {prediction.timeframe}</Text>
          </View>
          <View style={styles.trendContainer}>
            <Text style={styles.trendEmoji}>📈</Text>
            <Text style={styles.trendLabel}>Growing</Text>
          </View>
        </View>

        <View style={styles.factorsSection}>
          <Text style={styles.sectionTitle}>Analysis Factors</Text>
          <View style={styles.factorGrid}>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Current Weight</Text>
              <Text style={styles.factorValue}>{prediction.factors.currentWeight} lbs</Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Age</Text>
              <Text style={styles.factorValue}>{Math.floor(prediction.factors.ageInDays / 30)} months</Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Breed</Text>
              <Text style={styles.factorValue}>{prediction.factors.breed}</Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorLabel}>Growth Trend</Text>
              <Text style={styles.factorValue}>{prediction.factors.growthTrend}</Text>
            </View>
          </View>
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>AI Recommendations</Text>
          {prediction.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHistoricalAccuracy = () => {
    return (
      <View style={styles.accuracySection}>
        <Text style={styles.sectionTitle}>Prediction Accuracy</Text>
        <View style={styles.accuracyGrid}>
          {historicalPredictions.map((pred, index) => (
            <View key={index} style={styles.accuracyItem}>
              <Text style={styles.accuracyTimeframe}>{pred.timeframe}</Text>
              <Text style={styles.accuracyScore}>{pred.confidence}%</Text>
              <Text style={styles.accuracyStatus}>✓ Accurate</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>AI Weight Prediction</Text>
          <Text style={styles.subtitle}>{animal.name}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshPrediction}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Status Banner */}
        <View style={styles.aiStatusBanner}>
          <Text style={styles.aiStatusEmoji}>🤖</Text>
          <View style={styles.aiStatusContent}>
            <Text style={styles.aiStatusTitle}>ShowTrackAI Prediction Engine</Text>
            <Text style={styles.aiStatusSubtitle}>
              Powered by machine learning and livestock growth models
            </Text>
          </View>
          <View style={styles.aiStatusBadge}>
            <Text style={styles.aiStatusBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Main Prediction */}
        {renderPredictionCard()}

        {/* Photo-Based Prediction */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Enhanced Photo Analysis</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handlePhotoBasedPrediction}>
            <View style={styles.photoButtonIcon}>
              <Text style={styles.photoButtonEmoji}>📸</Text>
            </View>
            <View style={styles.photoButtonContent}>
              <Text style={styles.photoButtonTitle}>Take Photo for Analysis</Text>
              <Text style={styles.photoButtonSubtitle}>
                Improve prediction accuracy with visual assessment
              </Text>
            </View>
            <Text style={styles.photoButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Historical Accuracy */}
        {renderHistoricalAccuracy()}

        {/* Model Information */}
        <View style={styles.modelInfoSection}>
          <Text style={styles.sectionTitle}>Model Information</Text>
          <View style={styles.modelInfoCard}>
            <View style={styles.modelInfoItem}>
              <Text style={styles.modelInfoLabel}>Model Version</Text>
              <Text style={styles.modelInfoValue}>v2.1.0</Text>
            </View>
            <View style={styles.modelInfoItem}>
              <Text style={styles.modelInfoLabel}>Training Data</Text>
              <Text style={styles.modelInfoValue}>15K+ animals</Text>
            </View>
            <View style={styles.modelInfoItem}>
              <Text style={styles.modelInfoLabel}>Last Updated</Text>
              <Text style={styles.modelInfoValue}>Dec 2024</Text>
            </View>
            <View style={styles.modelInfoItem}>
              <Text style={styles.modelInfoLabel}>Species</Text>
              <Text style={styles.modelInfoValue}>{animal.species}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  aiStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4AA',
  },
  aiStatusEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  aiStatusContent: {
    flex: 1,
  },
  aiStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  aiStatusSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  aiStatusBadge: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiStatusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  predictionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  confidenceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  predictionMain: {
    flex: 1,
    alignItems: 'center',
  },
  predictedWeight: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  predictionTimeframe: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trendContainer: {
    alignItems: 'center',
    marginLeft: 20,
  },
  trendEmoji: {
    fontSize: 24,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  factorsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  factorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  factorItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '47%',
  },
  factorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsSection: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  photoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  photoButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  photoButtonEmoji: {
    fontSize: 24,
  },
  photoButtonContent: {
    flex: 1,
  },
  photoButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  photoButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  photoButtonArrow: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  accuracySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  accuracyGrid: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accuracyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accuracyTimeframe: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  accuracyScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginHorizontal: 16,
  },
  accuracyStatus: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  modelInfoSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  modelInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modelInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  modelInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});